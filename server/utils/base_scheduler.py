from abc import ABC, abstractmethod
from server.utils.base_task import TaskStatus
import server.utils.config as config

class BaseScheduler(ABC):
    def __init__(self):
        self.batch_queue = config.batch_queue
        self.unmapped_task = []
        self.stats = {
            'mapped': [],
            'deferred': [],
            'dropped': [],
        }

    @abstractmethod
    def schedule(self):
        """
        This method should be implemented by all child scheduler classes.
        It should handle selecting tasks and assigning them to machines.
        """
        pass

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
