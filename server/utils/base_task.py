from enum import Enum

class TaskStatus(Enum):
    NEW = 0
    MAPPED = 1
    DEFERRED = 2
    CANCELLED = 3

class Task:
    def __init__(self):
        self.id = None
        self.arrival_time = 0
        self.task_type = None
        self.execution_time = 0
        self.deadline = 0
        self.estimated_time = 0  

        self.start_time = None
        self.end_time = None
        self.assigned_machine = None

        self.status = TaskStatus.NEW
        self.no_of_deferring = 0
