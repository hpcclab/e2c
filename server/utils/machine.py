from queue import Queue  # Import the Queue class

class MachineType:
    def __init__(self, name):
        self.name = name


class Machine:
    def __init__(self, machine_type, speed=1, identifier=None, weight=1 ,queue_limit=5):
        """Represents a machine in the simulator.

        Parameters
        ----------
        machine_type : MachineType
            The type of machine this instance represents.
        speed : int, optional
            Processing speed of the machine. Defaults to ``1``.
        identifier : str | int, optional
            Optional unique identifier for the machine.
        queue_limit : int, optional
            Maximum number of tasks that can wait in the queue.
        """

        self.type = machine_type
        self.id = identifier
        self.queue = Queue(maxsize=queue_limit)  # Use Queue with a max size
        self.running_task = None

        # Initialize additional properties
        self.power = 0
        self.idle_power = 0
        self.replicas = 1
        self.price = 0
        self.cost = 0

    def is_working(self):
        return self.running_task is not None

    def admit(self, task):
        if self.running_task is None:
            self.running_task = (task,)
            return ("admitted", task)

        elif not self.queue.full():  # Check if the queue is not full
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
    
    def infoAsDict(self):
        return {
            "name": self.type.name,
            "queue": list(self.queue.queue),  # Convert queue to a list for display
            "running_task": self.running_task,
            "power": self.power,
            "idle_power": self.idle_power,
            "replicas": self.replicas,
            "price": self.price,
            "cost": self.cost
        }

    def __repr__(self):
        running_id = self.running_task[0].id if self.running_task else "None"
        queued_ids = [task.id for task in list(self.queue.queue)]
        label = self.id if self.id is not None else self.type.name
        return f"<Machine {label} speed={self.speed}, Running: {running_id}, Queue: {queued_ids}>"
