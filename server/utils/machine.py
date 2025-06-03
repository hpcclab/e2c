from queue import Queue

class MachineType:
    def __init__(self, name):
        self.name = name


class Machine:
    def __init__(self, machine_type, queue_limit=5):
        self.type = machine_type  # instance of MachineType
        self.queue = Queue(maxsize=queue_limit)
        self.running_task = None

    def is_working(self):
        return self.running_task is not None

    def admit(self, task):
        if self.running_task is None:
            self.running_task = (task,)
            return ("admitted", task)

        elif not self.queue.full():
            self.queue.put(task)
            return ("queued", task)

        else:
            return ("notEmpty", None)

    def finish_current_task(self):
        self.running_task = None
        if not self.queue.empty():
            next_task = self.queue.get()
            self.running_task = (next_task,)
            return next_task
        return None

    def __repr__(self):
        running_id = self.running_task[0].id if self.running_task else "None"
        queued_ids = [task.id for task in list(self.queue.queue)]
        return f"<Machine {self.type.name}, Running: {running_id}, Queue: {queued_ids}>"
