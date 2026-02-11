import os

from flask import Flask
from flask_cors import CORS
from server.routes.config import config_bp
from server.routes.flow_state_bp import flow_state_bp
from server.routes.iot_simulation_bp import iot_sim_bp
from server.routes.scheduling import scheduling_bp
from server.routes.workload import workload_bp

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))


# Uploads
app.config["UPLOAD_FOLDER"] = os.path.join(basedir, "static", "uploads")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

SAVE_FOLDER = os.path.join(os.getcwd(), "saved_states")
os.makedirs(SAVE_FOLDER, exist_ok=True)
app.config["SAVE_FOLDER"] = SAVE_FOLDER


# CORS for Vite frontend
CORS(
    app,
    resources={
        r"/api/*": {"origins": "http://localhost:5173"},
        r"/flow/*": {"origins": "http://localhost:5173"},
    },
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)

# Register blueprints
app.register_blueprint(scheduling_bp, url_prefix="/api/workload/simulate")
app.register_blueprint(workload_bp, url_prefix="/api/workload")
app.register_blueprint(config_bp, url_prefix="/api/config")
app.register_blueprint(flow_state_bp, url_prefix="/flow")
app.register_blueprint(iot_sim_bp, url_prefix="/api/iot_sim")


@app.route("/")
def index():
    return "Flask backend is running and ready."


if __name__ == "__main__":
    app.run(debug=True, port=5001)
