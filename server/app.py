from flask import Flask
from flask_cors import CORS
from server.routes.scheduling import scheduling_bp
from server.routes.workload import workload_bp
import os

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))

# Uploads
app.config['UPLOAD_FOLDER'] = os.path.join(basedir, 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# CORS for Vite frontend
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# Register blueprints
app.register_blueprint(scheduling_bp, url_prefix="/api/workload/simulate")
app.register_blueprint(workload_bp, url_prefix="/api/workload")

@app.route("/")
def index():
    return "Flask backend is running and ready."

if __name__ == "__main__":
    app.run(debug=True, port=5001)
