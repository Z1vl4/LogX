from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO

# Initialize database and SocketIO instances
db = SQLAlchemy()
socketio = SocketIO()

def create_app():
    # Create the Flask app and configure it
    app = Flask(__name__)
    # Example only – use environment variable or .env in production
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@host:port/dbname'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions with the app context
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

    # Import and register blueprints for API and dashboard
    from app.presenter.log_handler import logs_bp
    from app.views.dashboard import dashboard_bp

    app.register_blueprint(logs_bp, url_prefix='/logs')
    app.register_blueprint(dashboard_bp)

    return app
