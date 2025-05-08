from flask import Blueprint, request, jsonify
from app import db 
from app.models.logs import Logs  
from app.models.analysis_results import AnalysisResults  
from datetime import datetime, timedelta
from sqlalchemy import func, cast, DateTime

logs_bp = Blueprint('logs', __name__)

# Define a time threshold for filtering logs (last 24 hours)
time_threshold = datetime.now() - timedelta(hours=24)

# Return logs from the last 24 hours for display in the main log table
@logs_bp.route("/get_latest_logs", methods=["GET"])
def get_latest_logs():
    logs = db.session.query(
        Logs.id, Logs.timestamp, Logs.original_source, 
        AnalysisResults.threat_level
    ).outerjoin(AnalysisResults, Logs.id == AnalysisResults.log_id) \
    .filter(cast(Logs.timestamp, DateTime) >= time_threshold) \
    .order_by(Logs.id.desc()) \

    logs_data = []
    for log in logs:
        logs_data.append({
            "id": log.id,
            "timestamp": log.timestamp,
            "original_source": log.original_source,
            "threat_level": log.threat_level or "Loading..."
        })

    return jsonify(logs_data)
    
# Return logs from the last 14 days (used in pie chart visualization)
@logs_bp.route("/get_latest_logs_14d", methods=["GET"])
def get_latest_logs_14d():
    fourteen_days_ago = datetime.utcnow() - timedelta(days=14)

    logs = db.session.query(
        Logs.id, Logs.timestamp, Logs.original_source, 
        AnalysisResults.threat_level
    ).outerjoin(AnalysisResults, Logs.id == AnalysisResults.log_id) \
    .filter(cast(Logs.timestamp, DateTime) >= fourteen_days_ago) \
    .order_by(Logs.id.desc())

    logs_data = [{
        "id": log.id,
        "timestamp": log.timestamp,
        "original_source": log.original_source,
        "threat_level": log.threat_level or "Loading..."
    } for log in logs]

    return jsonify(logs_data)

# Return all details for a specific log entry by ID
@logs_bp.route("/get_log_details/<int:id>", methods=["GET"])
def get_log_details(id):
    log = db.session.query(Logs).filter(Logs.id == id).first() 
    analysis = db.session.query(AnalysisResults).filter(AnalysisResults.log_id == id).first() 

      
    log_data = {
            "id": log.id,
            "log_message": log.log_message,  
            "ip": log.ip,
            "timestamp": log.timestamp,
            "original_source": log.original_source,
            
            "threat_level": analysis.threat_level if analysis else "Unknown",
            "risk_description": analysis.risk_description if analysis else "Unknown"
        }
    return jsonify(log_data)

