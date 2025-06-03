import random
from server.utils.base_task import Task

def generate_tasks(n):
    tasks = []
    for i in range(n):
        t = Task()
        t.id = f"Task-{i}"
        t.arrival = random.randint(0, 5)
        t.execution_time = random.randint(1, 5)
        t.deadline = t.arrival + 10
        tasks.append(t)
    return tasks
