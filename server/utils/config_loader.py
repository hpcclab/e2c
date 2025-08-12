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
        speed = m.get("speed", 1)
        if m.get("weight") != None:
            weight = m.get("weight")
        else:
            weight = 1
        identifier = machine_id
        machine_id += 1
        machine_type = MachineType(type_name)
        
        machines.append(Machine(machine_type, speed=speed, identifier=identifier, weight=weight))

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
    
