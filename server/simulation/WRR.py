"""
Author: Joshua Yao 
Created on Jun., 22, 2025


"""

from server.utils.base_task import TaskStatus
from server.utils.base_scheduler import BaseScheduler
import server.utils.config as config
from server.utils.time import increment


class WRR(BaseScheduler):


    def __init__(self, total_no_of_tasks): 
        super(WRR, self).__init__()
        self.name = 'WRR'
        self.total_no_of_tasks = total_no_of_tasks
        self.prev_assignment_idx = -1
        # scheduler reqs
        self.weightsDict = {}
        self.machineQ = []
        self.schedlue_counter = 0
        self.mnIndex = -1

    def choose(self, index=0): #Get task, prob doesnt need to change
        task = self.batch_queue.get(index)
        self.unmapped_task.append(task)

        if config.settings.get('verbosity', False):
            s = f'\n{task.id} selected --> BQ = '
            bq = [t.id for t in self.batch_queue.list()]
            s += f'{bq}'
            s += f'\nexecutime: {task.execution_time}'
            config.log.write(s)

        return task


    def defer(self, task): #task things, prob doesnt need to change
        if config.time.gct() > task.deadline:
            self.drop(task)
            return 1

       
        task.status =  TaskStatus.DEFERRED
        task.no_of_deferring += 1
        self.batch_queue.put(task)
        self.stats['deferred'].append(task)

        self.stats['deferred'].append(task)
        
        if config.settings.get('verbosity', False):
            s = f'\n[ Task({task.id}),  _________ ]: Deferred @time({config.time.gct():.3f})'
            config.log.write(s)



    def drop(self, task): #task things, prob doesnt need to change
        task.status = TaskStatus.CANCELLED
        task.drop_time = config.time.gct()
        self.stats['dropped'].append(task)

        if config.settings.get('verbosity', False):
            s = f'\n[ Task({task.id}),  _________ ]: Cancelled @time({config.time.gct():.3f})'
            config.log.write(s)


    def map(self, machine): # Gives a task to a machine
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

    def round_robin_by_weight(self): # form scheduleQ
        #prep process
        mn = config.machines[0]
        if (len(self.machineQ) <= 0):
            for machine_i in config.machines: # might need to make global or seperate function
                max = -1
                for machine_j in config.machines: # get next highest weight
                    if (machine_j.weight > max and machine_j.id not in self.machineQ):
                        max = machine_j.weight
                        mn = machine_j
                self.machineQ.append(mn.id)
                self.weightsDict[mn.id] = mn.weight
       
    def schedule(self):
        self.round_robin_by_weight()
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

         # actual schedulin process below
        if(self.schedlue_counter <= 0): # loop if at end of Q
            if self.mnIndex >= (len(self.machineQ) - 1):
                self.mnIndex = -1
            self.mnIndex += 1
            self.schedlue_counter = self.weightsDict[self.machineQ[self.mnIndex]]
        # assign task
        if(self.schedlue_counter > 0):
            #ASSIGN TASK THEN COUNT DOWN
            self.schedlue_counter -= 1
            machine = config.machines[self.machineQ[self.mnIndex]] # getting machine by index
            available_machine = machine
            if available_machine != None:
                self.choose()
                self.map(available_machine)
                increment(0.01)
                return available_machine