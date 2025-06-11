from flask import Blueprint, request, jsonify, current_app
import os
import json
from server.services.workload_service import parse_csv_workload, simulate_fcfs
import server.utils.config as config
from server.utils.config_loader import load_config_file

workload_bp = Blueprint('workload', __name__)

@workload_bp.route('/upload', methods=['POST'])
def upload_workload():
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    filename = file.filename
    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(upload_path)

    try:
        if filename.endswith('.csv'):
            parsed = parse_csv_workload(upload_path)
            return jsonify({"message": "File uploaded successfully", "data": parsed}), 200
        else:
            return jsonify({"message": "File uploaded", "note": "Parsing for this filetype not implemented yet"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@workload_bp.route('/simulate/fcfs', methods=['POST'])
def run_fcfs_simulation():
    data = request.get_json()
    if not data or "tasks" not in data:
        return jsonify({"error": "Missing 'tasks' in request"}), 400

    try:
        results = simulate_fcfs(data["tasks"])
        return jsonify({"results": results}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@workload_bp.route('/upload/config', methods=['POST'])
def upload_config():
    file = request.files.get("file")
    if not file or not file.filename.endswith('.json'):
        return jsonify({"error": "Invalid or missing JSON file"}), 400

    try:
        # Ensure upload directory exists
        upload_dir = current_app.config.get('UPLOAD_FOLDER', 'static/uploads')
        os.makedirs(upload_dir, exist_ok=True)

        # Save file
        file_path = os.path.join(upload_dir, file.filename)
        file.save(file_path)

        # Parse configuration using shared loader
        try:
            load_config_file(file_path)
        except json.JSONDecodeError as ex:
            return jsonify({"error": f"Invalid JSON: {ex}"}), 400
        except Exception as ex:
            return jsonify({"error": str(ex)}), 400

        # Record dynamic path for later use
        config.settings["config_path"] = file_path

        return jsonify({
            "message": "Configuration loaded",
            "machines": [m.type.name for m in config.machines],
            "path": file_path
        }), 200

    except Exception as e:
        # Catch-all for unexpected errors
        return jsonify({"error": str(e)}), 500

