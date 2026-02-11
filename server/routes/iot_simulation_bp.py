from flask import Blueprint, jsonify, request
from server.services.workload_service import parse_csv_workload
from server.simulation.simulation_manager import SimulationManager

iot_sim_bp = Blueprint("iot_sim", __name__)
sim_manager = SimulationManager()


@iot_sim_bp.route("/upload_tasks", methods=["POST"])
def upload_tasks():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    filename = file.filename
    file_path = f"temp_uploads/{filename}"
    file.save(file_path)

    try:
        tasks = parse_csv_workload(file_path)
        iot_nodes = sim_manager.create_iot_nodes_from_tasks(tasks)
        return jsonify(
            {
                "message": "IOT nodes created",
                "iot_nodes": [iot.infoAsDict() for iot in iot_nodes],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@iot_sim_bp.route("/step", methods=["POST"])
def step_simulation():
    data = request.get_json()
    edges = data.get("edges", [])
    try:
        state = sim_manager.simulation_step(edges)
        return jsonify(state)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@iot_sim_bp.route("/reset", methods=["POST"])
def reset_simulation():
    sim_manager.reset()
    return jsonify({"message": "Simulation reset"})
