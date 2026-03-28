import json

import server.utils.config as config
from server.utils.machine import Machine, MachineType


def load_config_file(path):
    with open(path, "r") as f:
        data = json.load(f)
    load_machines(data)
    load_task_types(data)


def load_config_inline(data):
    """Load machine/task config directly from a dict (no file I/O)."""
    load_machines(data)
    load_task_types(data)


def load_machines(data):
    machines = []
    machine_id = 0

    for m in data.get("machines", []):
        type_name = m.get("name")
        power = m.get("power", 0)
        idle_power = m.get("idle_power", 0)
        replicas = m.get("replicas", 1)
        price = m.get("price", 0)
        cost = m.get("cost", 0)

        # Create a separate machine instance for each replica
        queue_limit = m.get("queue_limit", 0)  # 0 = unlimited

        for replica_num in range(replicas):
            machine_type = MachineType(type_name)

            machine = Machine(
                machine_type, identifier=machine_id, queue_limit=queue_limit
            )
            # Add additional properties to the machine object
            machine.power = power
            machine.idle_power = idle_power
            machine.replicas = replicas  # Store total replicas for reference
            machine.replica_number = replica_num + 1  # Track which replica this is
            machine.price = price
            machine.cost = cost
            machine.base_name = type_name  # Store the base machine type name
            machine.eet = m.get("eet", {})  # Execution Estimation Time lookup

            machines.append(machine)
            machine_id += 1

    config.machines = machines
    config.no_of_machines = len(machines)


def load_task_types(data):
    task_types = []
    task_type_names = []
    for task_type in data.get("task_types", []):
        name = task_type["name"]
        task_types.append(name)
        task_type_names.append(name)
    config.task_types = task_types
    config.task_type_names = task_type_names
