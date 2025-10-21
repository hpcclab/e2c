from flask import Blueprint, request, jsonify, current_app
import os
import json
import server.utils.config as config
from server.utils.config_loader import load_config_file

config_bp = Blueprint('config', __name__)

@config_bp.route('/update', methods=['POST'])
def update_config():
    """Update the configuration with new machine properties"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        print(f"Received data: {data}")  # Debug log
        print(f"Current config settings: {config.settings}")  # Debug log

        # Get the current config file path
        config_path = config.settings.get("config_path")
        if not config_path:
            return jsonify({"error": "No config file currently loaded. Please upload a config file first."}), 400

        if not os.path.exists(config_path):
            return jsonify({"error": f"Config file not found at path: {config_path}"}), 400

        # Save the updated config to file
        with open(config_path, 'w') as f:
            json.dump(data, f, indent=2)

        # Reload the config
        load_config_file(config_path)

        return jsonify({
            "message": "Configuration updated successfully",
            "machines": [m.infoAsDict() for m in config.machines]
        }), 200

    except Exception as e:
        print(f"Error updating config: {str(e)}")  # Debug log
        return jsonify({"error": str(e)}), 500

@config_bp.route('/current', methods=['GET'])
def get_current_config():
    """Get the current configuration"""
    try:
        config_path = config.settings.get("config_path")
        if not config_path or not os.path.exists(config_path):
            return jsonify({"error": "No config file currently loaded"}), 404

        with open(config_path, 'r') as f:
            current_config = json.load(f)

        return jsonify({
            "config": current_config,
            "path": config_path
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
