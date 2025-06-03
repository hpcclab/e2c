import json
import server.utils.config as config
from server.utils.machine import Machine  # Update path if needed

def load_config_file(path):
    with open(path, 'r') as f:
        data = json.load(f)

    machines = []
    for m in data.get("machines", []):
        type_name = m.get("type")
        cores = m.get("cores", 1)
        machines.append(Machine(type_name=type_name, cores=cores))

    config.machines = machines
    config.no_of_machines = len(machines)
