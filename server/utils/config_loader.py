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
        identifier = machine_id
        machine_id += 1
        machine_type = MachineType(type_name)
        
        machines.append(Machine(machine_type, speed=speed, identifier=identifier))

    config.machines = machines
    config.no_of_machines = len(machines)

def load_task_types(data):
    task_types = []
    task_type_names = []
    # for task_type in task_types_info:
    #     id = task_type['id']
    #     name = task_type['name']
    #     urgency = task_type['urgency']
    #     if urgency == 'BestEffort':
    #         urgency = UrgencyLevel.BESTEFFORT
    #     elif urgency == 'Urgent':
    #         urgency = UrgencyLevel.URGENT
    #     if task_type['deadline'] == 'inf':
    #         deadline = float('inf')
    #     else:
    #         deadline = task_type['deadline']

    #     task_types.append(TaskType(id, name, urgency,deadline))
    #     task_type_names.append(name)
    return task_types, task_type_names
    
