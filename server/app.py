from flask import Flask
from flask_cors import CORS
import os

# Import blueprints
from routes.workload import workload_bp
# You can later add more like:
# from routes.load_balancer import load_balancer_bp
# from routes.machines import machines_bp
# from routes.tasks import tasks_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configuration
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload

    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register blueprints
    app.register_blueprint(workload_bp, url_prefix='/api/workload')
    # app.register_blueprint(load_balancer_bp, url_prefix='/api/load_balancer')
    # app.register_blueprint(machines_bp, url_prefix='/api/machines')
    # app.register_blueprint(tasks_bp, url_prefix='/api/tasks')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5001)
