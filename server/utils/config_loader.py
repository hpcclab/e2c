import json
import server.utils.config as config
from server.utils.machine import Machine, MachineType

def load_config_file(path):
    with open(path, 'r') as f:
        data = json.load(f)
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
        identifier = machine_id
        machine_id += 1
        machine_type = MachineType(type_name)
        
        machine = Machine(machine_type, identifier=identifier)
        # Add additional properties to the machine object
        machine.power = power
        machine.idle_power = idle_power
        machine.replicas = replicas
        machine.price = price
        machine.cost = cost
        
        machines.append(machine)

    config.machines = machines
    config.no_of_machines = len(machines)

def load_task_types(data):
    task_types = []
    task_type_names = []
    for task_type in data.get("task_types", []):
        name = task_type['name']
        task_types.append(name)
        task_type_names.append(name)
    config.task_types = task_types
    config.task_type_names = task_type_names

