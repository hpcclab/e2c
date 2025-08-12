from flask import Blueprint, request, jsonify, current_app
import os
import json
from server.services.workload_service import parse_csv_workload, simulate_fcfs, simulate_load_balancing
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


@workload_bp.route('/upload/config', methods=['POST'])
def upload_config():
    file = request.files.get("file")
    file_path = None

    if file:
        # Validate and save the uploaded file
        if not file.filename.endswith('.json'):
            return jsonify({"error": "Invalid or missing JSON file"}), 400

        try:
            # Ensure upload directory exists
            upload_dir = current_app.config.get('UPLOAD_FOLDER', 'static/uploads')
            os.makedirs(upload_dir, exist_ok=True)

            # Save file
            file_path = os.path.join(upload_dir, file.filename)
            file.save(file_path)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        # Use an existing file if no file is uploaded
        file_path = request.json.get("config_path")
        if not file_path or not os.path.exists(file_path):
            return jsonify({"error": "Config file not found"}), 400

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
        "machines": [m.infoAsDict() for m in config.machines],
        "path": file_path
    }), 200
