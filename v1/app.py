

from app import create_app, db, socketio
import threading
from app.presenter.syslog import run_syslog_listener
from app.presenter.snmp_parser import run_snmp_listener

# Create the Flask application
app = create_app()

# Initialize the database and create tables if they don't exist
with app.app_context():
    try:
        db.create_all()
        print("Database tables checked/created successfully.")
    except Exception as e:
        print(f"Database connection failed: {e}")

# Start background thread to run the syslog listener
syslog_thread = threading.Thread(target=run_syslog_listener, args=(app,), daemon=True)
syslog_thread.start()

# Start background thread to run the SNMP listener
snmp_thread = threading.Thread(target=run_snmp_listener, args=(app,), daemon=True)
snmp_thread.start()

# Run the Flask app (port 5001)
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001, use_reloader=False)



