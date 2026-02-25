from queue import Queue


class IOTDevice:
    def __init__(self, task_type):
        self.task_type = task_type
        self.tasks = Queue()  # queue of tasks

    def add_tasks(self, task_list):
        for task in task_list:
            self.tasks.put(task)

    def has_tasks(self):
        return not self.tasks.empty()

    def pop_task(self):
        if self.has_tasks():
            return self.tasks.get()
        return None

    def infoAsDict(self):
        return {
            "task_type": self.task_type,
            "queue": list(self.tasks.queue),
            "queued_count": self.tasks.qsize(),
        }


class LoadBalancer:
    def __init__(self, policy="RoundRobin"):
        self.policy = policy
        self.connected_machines = []
        self.rr_index = 0  # round robin index

    def connect_machine(self, machine):
        self.connected_machines.append(machine)

    def forward(self, task):
        if not self.connected_machines:
            return None
        # implement simple round-robin for now
        if self.policy == "RoundRobin":
            machine = self.connected_machines[
                self.rr_index % len(self.connected_machines)
            ]
            self.rr_index += 1
        else:
            # default fallback: choose machine with least tasks
            machine = min(self.connected_machines, key=lambda m: m.queue.qsize())
        result = machine.admit(task)
        return result
