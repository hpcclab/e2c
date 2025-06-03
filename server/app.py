from flask import Flask
from flask_cors import CORS
import os

# Create Flask app
app = Flask(__name__)

# Base directory
basedir = os.path.abspath(os.path.dirname(__file__))

# Upload folder configuration
app.config['UPLOAD_FOLDER'] = os.path.join(basedir, 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Optional: 16MB upload limit

# Ensure the upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Enable CORS for frontend at localhost:5173 (Vite)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# Register blueprints
from server.routes.scheduling import scheduling_bp
from server.routes.workload import workload_bp

app.register_blueprint(scheduling_bp, url_prefix="/api/scheduling")
app.register_blueprint(workload_bp, url_prefix="/api/workload")

# Optional: Health check
@app.route("/")
def index():
    return "✅ Flask backend is running and ready."

# Run the app
if __name__ == "__main__":
    app.run(debug=True, port=5001)
