import csv
from server.simulation.fcfs import FCFS
from server.simulation.RAND import RAND
from server.simulation.LC import LC
from server.simulation.URI import URI
from server.simulation.WRR import WRR

def simulate_load_balancing(policy, tasks):
    schedule = None
    if policy == 'MinCompletion-MinCompletion':
        raise NotImplementedError("Policy 'MinCompletion-MinCompletion' not implemented")
    elif policy == 'MinCompletion-SoonestDeadline':
        raise NotImplementedError("Policy 'MinCompletion-SoonestDeadline' not implemented")
    elif policy == 'MinCompletion-MaxUrgency':
        raise NotImplementedError("Policy 'MinCompletion-MaxUrgency' not implemented")
    elif policy == 'FELARE':
        raise NotImplementedError("Policy 'FELARE' not implemented")
    elif policy == 'ELARE':
        raise NotImplementedError("Policy 'ELARE' not implemented")
    elif policy == 'FirstCome-FirstServe':
        schedule = FCFS(tasks)
    elif policy == 'Weighted-Round-Robin':
        schedule = WRR(tasks)
    elif policy == 'Least-Connection':
        schedule = LC(tasks)
    elif policy == 'Random':
        schedule = RAND(tasks)
    elif policy == 'Uniform-Resource-Identifier':
        schedule = URI(tasks)
    elif policy == 'Min-Expected-Completion-Time':
        raise NotImplementedError("Policy 'Min-Expected-Completion-Time' not implemented")
    elif policy == 'Min-Expected-Execution-Time':
        raise NotImplementedError("Policy 'Min-Expected-Execution-Time' not implemented")
    else:
        raise ValueError(f"Unknown policy '{policy}'")
    return schedule

def simulate_fcfs(tasks):
    """
    Simulate First-Come First-Serve scheduling on a list of task dictionaries.
    Each task must have 'arrival_time' and 'execution_time' keys.
    """
    time = 0
    results = []
    for task in sorted(tasks, key=lambda t: int(t["arrival_time"])):
        arrival = int(task["arrival_time"])
        exec_time = int(task["execution_time"])
        start_time = max(time, arrival)
        finish_time = start_time + exec_time
        results.append({
            "task_id": task["id"],
            "arrival_time": arrival,
            "start_time": start_time,
            "finish_time": finish_time,
            "wait_time": start_time - arrival,
            "execution_time": exec_time,
            "machine_id": task.get("machine_id"),  # Include machine ID if available
            "machine_type": task.get("machine_type"),  # Include machine type if available
        })
        time = finish_time
    return results

def parse_csv_workload(file_path):
    """
    Parse a CSV file and return a list of task dictionaries.
    Assumes each row has at least: id, arrival_time, execution_time
    """
    parsed_data = []
    with open(file_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            parsed_data.append(row)
    return parsed_data
