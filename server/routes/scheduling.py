import os

from flask import Blueprint, current_app, jsonify, request  # Import current_app

import server.utils.config as config
from server.services.workload_service import simulate_load_balancing
from server.utils.config_loader import load_config_file, load_config_inline
from server.utils.task_generator import generate_tasks_from_batch
from server.utils.time import increment, reset

scheduling_bp = Blueprint("scheduling_bp", __name__)


@scheduling_bp.route("/data", methods=["POST", "OPTIONS"])
def run_sim():
    if request.method == "OPTIONS":
        return "", 200  # Allow CORS preflight

    data = request.get_json()
    num_tasks = data.get("numTasks", 10)
    config_filename = data.get("configFilename")
    machine_config = data.get("machineConfig")  # Inline config from canvas
    policy = data["schedulingPolicy"]

    # Reset the global simulator state
    config.reset()
    reset()  # Reset global time

    if machine_config:
        # Inline config provided from canvas nodes
        print(f"Loading inline config with {len(machine_config.get('machines', []))} machines")
        load_config_inline(machine_config)
    elif config_filename:
        # File-based config
        config_path = os.path.join(current_app.config["UPLOAD_FOLDER"], config_filename)
        print(f"Attempting to load config file from: {config_path}")
        try:
            load_config_file(config_path)
        except FileNotFoundError:
            return jsonify({"error": f"Config file not found: {config_path}"}), 500
    else:
        return jsonify({"error": "No machine config provided"}), 400

    # Apply EET from profilingData if provided
    profiling_data = data.get("profilingData", [])
    if profiling_data:
        eet_lookup = {}  # { machineName: { taskType: seconds } }
        for row in profiling_data:
            m_name = row.get("machine") or row.get("machineName") or row.get("Machine")
            t_type = row.get("taskType") or row.get("task_type") or row.get("TaskType")
            eet_val = row.get("eet") or row.get("EET") or row.get("execution_time")
            if m_name and t_type and eet_val is not None:
                eet_lookup.setdefault(m_name, {})[t_type] = float(eet_val)
        # Apply EET to matching machines
        for machine in config.machines:
            base = machine.base_name or machine.type.name
            if base in eet_lookup:
                machine.eet = {**machine.eet, **eet_lookup[base]}

    batch_queue = data.get("tasks", [])
    tasks = generate_tasks_from_batch(batch_queue)
    config.batch_queue.load(tasks)

    print("\n<<<<<<<SIMULATION>>>>>>>>>>\n")
    try:
        # pass the task list, not num_tasks
        scheduler = simulate_load_balancing(policy, tasks)
    except NotImplementedError as nie:
        return jsonify({"error": str(nie)}), 400
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400

    while not config.batch_queue.empty() or scheduler.unmapped_task:
        scheduler.schedule()
        increment(0.01)  # Increment global time after each scheduling step

    # Ensure UI-compatible task IDs are returned with aliases and fallback
    results = []
    for idx, task in enumerate(tasks, start=1):
        tid = getattr(task, "id", None) or idx

        # Get machine information including replica details
        machine_info = None
        if task.assigned_machine:
            machine_info = {
                "id": task.assigned_machine.id,
                "name": task.assigned_machine.base_name
                or task.assigned_machine.type.name,
                "replica_number": task.assigned_machine.replica_number,
                "display_name": task.assigned_machine.infoAsDict()["name"],
            }
        
        results.append({
            "id": tid,
            "taskId": tid,
            "task_id": tid,
            "task_type": task.task_type,
            "machineId": task.assigned_machine.id if task.assigned_machine else None,
            "assigned_machine": machine_info["display_name"] if machine_info else None,
            "machine_base_name": machine_info["name"] if machine_info else None,
            "machine_replica_number": machine_info["replica_number"] if machine_info else None,
            "arrival_time": task.arrival_time,
            "start": task.start_time,
            "end": task.end_time,
            "execution_time": task.execution_time,  
            "deadline": task.deadline,              
            "status": (
                "DEADLINE_MISSED"
                if task.end_time and task.deadline and task.deadline > 0 and task.end_time > task.deadline
                else task.status.name
            ),
            "data_size": getattr(task, "data_size", 0),  # Use getattr with default value
        })
    
    # Calculate the actual simulation time as the max end time
    simulation_time = max(
        (task.end_time for task in tasks if task.end_time is not None),
        default=0,
    )

    # Return machine utilization data grouped by base type
    machine_stats = {}
    for machine in config.machines:
        base_name = machine.base_name or machine.type.name
        if base_name not in machine_stats:
            machine_stats[base_name] = {
                "base_name": base_name,
                "total_replicas": machine.replicas,
                "replicas": [],
            }

        # Calculate utilization for this replica
        assigned_tasks = [
            t
            for t in tasks
            if t.assigned_machine and t.assigned_machine.id == machine.id
        ]
        utilization_time = sum(
            (t.end_time - t.start_time)
            for t in assigned_tasks
            if t.start_time and t.end_time
        )

        machine_stats[base_name]["replicas"].append(
            {
                "id": machine.id,
                "replica_number": machine.replica_number,
                "tasks_completed": len(assigned_tasks),
                "utilization_seconds": utilization_time,
                "utilization_hours": utilization_time / 3600,
                "cost": (utilization_time / 3600) * machine.price,
            }
        )

    return jsonify(
        {
            "results": results,
            "simulationTime": simulation_time,
            "machine_stats": list(machine_stats.values()),
        }
    ), 200
