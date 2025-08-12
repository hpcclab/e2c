"""
Author: Joshua Yao
Created on Jun., 22, 2025
"""

from server.utils.base_task import TaskStatus
from server.utils.base_scheduler import BaseScheduler
import server.utils.config as config
from server.utils.time import increment
import random


class RAND(BaseScheduler):

    def __init__(self, total_no_of_tasks): 
        super(RAND, self).__init__()
        self.name = 'RAND'
        self.total_no_of_tasks = total_no_of_tasks
        self.prev_assignment_idx = -1

        if not config.machines or len(config.machines) == 0:
            raise RuntimeError("config.machines must be initialized before using RAND scheduler.")

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


    def getRandMachine(self): # form scheduleQ
        #prep process
        rm1 = random.randint(0, (len(config.machines) - 1)) # get 1st random machine index
        rm2 = random.randint(0, (len(config.machines) - 1)) # get 2nd random machine index
        if (len(config.machines[rm1].queue.queue) <= len(config.machines[rm2].queue.queue)): # select machine with fewest taskes then assign new to task to selected machine
            mn = config.machines[rm1]
        else:
            mn = config.machines[rm2]
        return mn
    
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

         # actual schedulin process below
            #ASSIGN TASK THEN COUNT DOWN
        machine = self.getRandMachine() # getting machine by index
        available_machine = machine
        if available_machine != None:
            self.choose()
            self.map(available_machine)
            increment(0.01)
            return available_machine