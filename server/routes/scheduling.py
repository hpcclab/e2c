from flask import Blueprint, request, jsonify, current_app  # Import current_app
from server.utils.config_loader import load_config_file
from server.utils.task_generator import generate_tasks_from_batch
from server.services.workload_service import simulate_load_balancing

from server.utils.time import reset, increment, gct
import server.utils.config as config
import os

scheduling_bp = Blueprint('scheduling_bp', __name__)

@scheduling_bp.route('/data', methods=['POST', 'OPTIONS'])
def run_sim():
    if request.method == 'OPTIONS':
        return '', 200  # Allow CORS preflight

    data = request.get_json()
    num_tasks = data.get("numTasks", 10)
    config_filename = data.get("configFilename")
    policy = data["schedulingPolicy"]

    if not config_filename:
        return jsonify({"error": "No config filename provided"}), 400

    # Use the absolute path for the config file
    config_path = os.path.join(current_app.config['UPLOAD_FOLDER'], config_filename)
    print(f"Attempting to load config file from: {config_path}")  # Debugging

    # Reset the global simulator state
    config.reset()
    reset()  # Reset global time


    try:
        load_config_file(config_path)
    except FileNotFoundError:
        return jsonify({"error": f"Config file not found: {config_path}"}), 500

    batch_queue = data.get("tasks", [])
    tasks = generate_tasks_from_batch(batch_queue)    
    config.batch_queue.load(tasks)

    print(f"\n<<<<<<<SIMULATION>>>>>>>>>>\n")
    try:
        # pass the task list, not num_tasks
        scheduler = simulate_load_balancing(policy, tasks)
    except NotImplementedError as nie:
        return jsonify({"error": str(nie)}), 400
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400

    while not config.batch_queue.empty():
        scheduler.schedule()
        increment(0.01)  # Increment global time after each scheduling step

    # Ensure UI-compatible task IDs are returned with aliases and fallback
    results = []
    for idx, task in enumerate(tasks, start=1):
        tid = getattr(task, "id", None) or idx
        results.append({
            "id": tid,                         # UI-friendly key
            "taskId": tid,                     # Backward compatibility
            "task_id": tid,                    # Snake_case alias
            "task_type": task.task_type,
            "machineId": task.assigned_machine.id if task.assigned_machine else None,
            "assigned_machine": task.assigned_machine.type.name if task.assigned_machine else None,
            "arrival_time": task.arrival_time,
            "start": task.start_time,
            "end": task.end_time,
            "status": task.status.name,
        })
    
    # Calculate the actual simulation time as the max end time
    simulation_time = max((task.end_time for task in tasks if task.end_time is not None), default=0)
    
    return jsonify({
        "results": results,
        "simulationTime": simulation_time  # Use max end time
    }), 200