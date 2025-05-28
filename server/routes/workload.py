from flask import Blueprint, request, jsonify, current_app
import os
from services.workload_service import parse_csv_workload

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
