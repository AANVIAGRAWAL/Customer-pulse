import os
import sys
from flask import Flask
from flask_cors import CORS

# Ensure project root is in path so we can import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import Config
from backend.api.error_handlers import register_error_handlers
from backend.api.routes import api_bp
from backend.services.ml_service import ml_service

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Register error handlers
    register_error_handlers(app)
    
    # Initialize ML service
    ml_service.load_model()
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    return app

if __name__ == '__main__':
    app = create_app()
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, host='127.0.0.1', port=5000)
