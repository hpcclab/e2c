import random
from server.utils.base_task import Task

def _to_float(val, default=0.0):
    try:
        return float(val)
    except (TypeError, ValueError):
        return float(default)

def _to_int(val, default=0):
    try:
        return int(float(val))
    except (TypeError, ValueError):
        return int(default)

def generate_tasks_from_batch(batch_queue):
    """
    Generate Task objects from a list of dicts (the batch queue).
    """
    tasks = []
    for i, row in enumerate(batch_queue):
        t = Task()
        # prefer provided id, fallback to index
        t.id = _to_int(row.get("id"), i)

        # map fields safely
        t.task_type = row.get("task_type") or row.get("type")
        t.arrival_time = _to_float(row.get("arrival_time"), 0)

        # allow either 'execution_time' or 'data_size' as the time proxy
        exec_src = row.get("execution_time", row.get("data_size", 1))
        t.execution_time = _to_float(exec_src, 1)

        t.deadline = _to_float(row.get("deadline"), 0)
        tasks.append(t)
    return tasks