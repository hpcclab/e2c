import json
import server.utils.config as config
from server.utils.machine import Machine, MachineType

def load_config_file(path):
    with open(path, 'r') as f:
        data = json.load(f)

    machines = []
    for m in data.get("machines", []):
        type_name = m.get("type")
        speed = m.get("speed", 1)
        identifier = m.get("id")
        machine_type = MachineType(type_name)
        machines.append(Machine(machine_type, speed=speed, identifier=identifier))

    config.machines = machines
    config.no_of_machines = len(machines)
