import server.utils.config as config
from server.simulation.iot_simulation import IOTDevice, LoadBalancer


class SimulationManager:
    def __init__(self):
        self.iot_nodes = []  # list of IOTDevice
        self.load_balancers = []  # list of LoadBalancer
        self.machines = config.machines  # all machines loaded from config

    def reset(self):
        self.iot_nodes.clear()
        self.load_balancers.clear()
        for machine in self.machines:
            machine.queue.queue.clear()
            machine.running_task = None

    def create_iot_nodes_from_tasks(self, task_list):
        task_types = {}
        for task in task_list:
            ttype = task.get("task_type", "default")
            if ttype not in task_types:
                task_types[ttype] = []
            task_types[ttype].append(task)

        self.iot_nodes = []
        for ttype, tasks in task_types.items():
            iot = IOTDevice(ttype)
            iot.add_tasks(tasks)
            self.iot_nodes.append(iot)
        return self.iot_nodes

    def simulation_step(self, edges):
        """
        edges: list of dict {source, target, type} from React Flow
        source and target are node IDs
        type: 'iot-machine' or 'iot-lb'
        """
        # Map node IDs to objects
        node_map = {}
        for iot in self.iot_nodes:
            node_map[f"IOT-{iot.task_type}"] = iot
        for machine in self.machines:
            node_map[f"MACHINE-{machine.id}"] = machine
        for lb in self.load_balancers:
            node_map[f"LB-{id(lb)}"] = lb

        # Forward tasks along edges
        for edge in edges:
            source = node_map.get(edge["source"])
            target = node_map.get(edge["target"])
            if source is None or target is None:
                continue
            if isinstance(source, IOTDevice):
                task = source.pop_task()
                if task:
                    if isinstance(target, LoadBalancer):
                        target.forward(task)
                    elif hasattr(target, "admit"):  # Machine
                        target.admit(task)

        # Advance machines
        for machine in self.machines:
            machine.finish_current_task()

        # Return state for frontend
        return {
            "machines": [m.infoAsDict() for m in self.machines],
            "iots": [iot.infoAsDict() for iot in self.iot_nodes],
        }
