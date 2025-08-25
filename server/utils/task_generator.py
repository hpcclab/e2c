import random
from server.utils.base_task import Task

from server.utils.base_task import Task

def generate_tasks_from_batch(batch_queue):
    """
    Generate Task objects from a list of dicts (the batch queue).
    """
    tasks = []
    for i, row in enumerate(batch_queue):
        t = Task()
        t.id = i
        t.task_type = row.get("task_type")
        t.arrival_time = float(row.get("arrival_time", 0))
        t.execution_time = float(row.get("data_size", 1))  # or use another field if needed
        t.deadline = float(row.get("deadline", 0))
        tasks.append(t)
    return tasks