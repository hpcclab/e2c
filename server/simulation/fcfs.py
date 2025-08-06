from server.utils.base_scheduler import BaseScheduler
from server.utils.base_task import TaskStatus
from server.utils.time import increment
import server.utils.config as config

class FCFS(BaseScheduler):

    def __init__(self, total_no_of_tasks):
        super(FCFS, self).__init__()
        self.name = 'FCFS'
        self.total_no_of_tasks = total_no_of_tasks
        self.prev_assignment_idx = -1

        if not config.machines or len(config.machines) == 0:
            raise RuntimeError("config.machines must be initialized before using FCFS scheduler.")

    def choose(self, index=0):
        task = self.batch_queue.get(index)
        self.unmapped_task.append(task)

        if config.settings.get('verbosity', False):
            s = f'\n{task.id} selected --> BQ = '
            bq = [t.id for t in self.batch_queue.list()]
            s += f'{bq}'
            s += f'\nexecutime: {task.execution_time}'
            config.log.write(s)

        return task

    def defer(self, task):
        if config.time.gct() > task.deadline:
            self.drop(task)
            return 1

        task.status = TaskStatus.DEFERRED
        task.no_of_deferring += 1
        self.batch_queue.put(task)
        self.stats['deferred'].append(task)

        if config.settings.get('verbosity', False):
            s = f'\n[ Task({task.id}),  _________ ]: Deferred @time({config.time.gct():.3f})'
            config.log.write(s)

    def drop(self, task):
        task.status = TaskStatus.CANCELLED
        task.drop_time = config.time.gct()
        self.stats['dropped'].append(task)

        if config.settings.get('verbosity', False):
            s = f'\n[ Task({task.id}),  _________ ]: Cancelled @time({config.time.gct():.3f})'
            config.log.write(s)

    def map(self, machine):
        task = self.unmapped_task.pop()
        assignment, _ = machine.admit(task)

        if assignment != 'notEmpty':
            task.assigned_machine = machine
            task.start_time = config.time.gct()
            task.end_time = task.start_time + task.execution_time
            self.stats['mapped'].append(task)

            if config.settings.get('verbosity', False):
                s = f"\ntask: {task.id} assigned to: {machine.type.name} | deadline: {task.deadline}"
                config.log.write(s)
        else:
            self.unmapped_task.append(task)

    def first_available_machine(self):
        for machine in config.machines:
            if not machine.is_working():
                return machine

        min_qlen = float('inf')
        min_qlen_machine = None
        for machine in config.machines:
            if not machine.queue.full() and machine.queue.qsize() < min_qlen:
                min_qlen = machine.queue.qsize()
                min_qlen_machine = machine

        return min_qlen_machine

    def schedule(self):
        if config.settings.get('verbosity', False):
            s = f'\nCurrent State @ {config.time.gct()}'
            s += '\nBQ = '
            bq = [t.id for t in self.batch_queue.list()]
            s += f'{bq}\n\nMACHINES ==>>>'
            for m in config.machines:
                s += f'\n\tMachine {m.type.name} :'
                r = [m.running_task[0].id] if m.running_task else []
                mq = [t.id for t in list(m.queue.queue)]  # Convert queue to a list
                r.append(mq)
                s += f'\t{r}'
            config.log.write(s)

        if self.batch_queue.empty():
            return None

        machine_count = len(config.machines)
        machine_index = (self.prev_assignment_idx + 1) % machine_count
        self.prev_assignment_idx = machine_index
        available_machine = config.machines[machine_index]

        if available_machine:
            self.choose()
            self.map(available_machine)
            increment(0.01)
            return available_machine