import json
import os
from datetime import datetime

from flask import Blueprint, current_app, jsonify, request

flow_state_bp = Blueprint("flow_state", __name__)


def get_save_folder():
    folder = current_app.config.get("SAVE_FOLDER", "saved_states")
    os.makedirs(folder, exist_ok=True)
    return folder


@flow_state_bp.route("/save_state", methods=["POST"])
def save_state():
    data = request.get_json()
    filename = data.get("filename")
    if not filename:
        return jsonify({"error": "Filename required"}), 400

    save_folder = get_save_folder()
    save_path = os.path.join(save_folder, filename)

    if not os.path.exists(save_path):
        return jsonify({"error": "File does not exist, use Save As"}), 400

    try:
        with open(save_path, "w") as f:
            json.dump(
                {
                    "nodes": data.get("nodes", []),
                    "edges": data.get("edges", []),
                    "machines": data.get("machines", []),
                    "iot": data.get("iot", []),
                },
                f,
                indent=2,
            )
        return jsonify({"message": "State saved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@flow_state_bp.route("/save_as", methods=["POST"])
def save_as():
    data = request.get_json()
    filename = data.get("filename")
    if not filename:
        filename = f"flow_state_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    if not filename.endswith(".json"):
        filename += ".json"

    save_folder = get_save_folder()
    save_path = os.path.join(save_folder, filename)

    try:
        with open(save_path, "w") as f:
            json.dump(
                {"nodes": data.get("nodes", []), "edges": data.get("edges", [])},
                f,
                indent=2,
            )
        return jsonify(
            {"message": "State saved successfully", "filename": filename}
        ), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@flow_state_bp.route("/load_state", methods=["POST"])
def load_state():
    filename = request.json.get("filename")
    if not filename:
        return jsonify({"error": "Filename not provided"}), 400

    save_folder = get_save_folder()
    file_path = os.path.join(save_folder, filename)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        with open(file_path, "r") as f:
            data = json.load(f)
        return jsonify({"message": "State loaded successfully", "data": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@flow_state_bp.route("/list_states", methods=["GET"])
def list_states():
    save_folder = get_save_folder()
    files = [f for f in os.listdir(save_folder) if f.endswith(".json")]
    return jsonify({"files": files}), 200


@flow_state_bp.route("/rename_state", methods=["POST"])
def rename_state():
    old_name = request.json.get("old_name")
    new_name = request.json.get("new_name")
    save_folder = get_save_folder()
    old_path = os.path.join(save_folder, old_name)
    new_path = os.path.join(save_folder, new_name)

    if not os.path.exists(old_path):
        return jsonify({"error": "File not found"}), 404
    if os.path.exists(new_path):
        return jsonify({"error": "New file name already exists"}), 400

    os.rename(old_path, new_path)
    return jsonify({"message": "File renamed successfully"}), 200


@flow_state_bp.route("/delete_state", methods=["POST"])
def delete_state():
    filename = request.json.get("filename")
    if not filename:
        return jsonify({"error": "Filename required"}), 400

    save_folder = get_save_folder()
    file_path = os.path.join(save_folder, filename)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        os.remove(file_path)
        return jsonify({"message": "File deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
