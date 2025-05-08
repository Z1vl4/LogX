from datetime import datetime
from app import db, socketio
from app.models.logs import Logs
from app.presenter.ai_parser import analyze_log, save_analysis
from flask_socketio import SocketIO, emit
from datetime import datetime

import socketserver
import logging
import threading
import re


# Regex patterns for extracting timestamp, IP address, and log message
date_pattern = re.compile(r"(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})")  
ip_pattern = re.compile(r"(\d+\.\d+\.\d+\.\d+)")  
message_pattern = re.compile(r"(?<=\]:\s)(.*)")  

def parse_log(data):
    logging.debug(f"🔹 Parsing log data: {data}")

    date_match = date_pattern.search(data)
    ip_match = ip_pattern.search(data)
    message_match = message_pattern.search(data)

    logging.debug(f"Date match: {date_match.group() if date_match else 'No match'}")
    logging.debug(f"IP match: {ip_match.group() if ip_match else 'No match'}")
    logging.debug(f"Message match: {message_match.group() if message_match else 'No match'}")

    if date_match and ip_match and message_match:
        try:
            # Combine extracted date with current year and format as full timestamp
            timestamp_str = date_match.group(1)
            current_year = datetime.now().year
            timestamp_str = f"{current_year} {timestamp_str}"
            timestamp = datetime.strptime(timestamp_str, "%Y %b %d %H:%M:%S").strftime("%Y-%m-%d %H:%M:%S")
            ip = ip_match.group(1)
            log_message = message_match.group(1)

            return {
                "timestamp": timestamp,
                "ip": ip,
                "log_message": log_message,
                "original_source": "syslog"  
            }

        except Exception as e:
            logging.error(f"Error while processing log: {e}")
            return None
    else:
        logging.error("Log parsing failed: Invalid log format.")
        return None

    

def insert_log(log_data, app):
    if not log_data or "ip" not in log_data or "timestamp" not in log_data or "log_message" not in log_data:
        logging.warning("Skipping log insertion due to invalid data.")
        return

    with app.app_context():
        try:
            # Convert timestamp to string if needed
            timestamp_str = (
                log_data["timestamp"].strftime('%Y-%m-%d %H:%M:%S') 
                if isinstance(log_data["timestamp"], datetime) 
                else log_data["timestamp"]
            )

            # Check for duplicate logs
            existing_log = Logs.query.filter_by(
                ip=log_data.get("ip"),
                timestamp=timestamp_str,
                log_message=log_data.get("log_message"),
                original_source=log_data.get("original_source"),
            ).first()

            if existing_log:
                logging.warning(f"Duplicate log detected. Skipping insertion for {log_data['ip']}")
                return

            # Insert new log entry
            new_log = Logs(
                ip=log_data["ip"],
                timestamp=timestamp_str,
                log_message=log_data["log_message"],
                original_source=log_data["original_source"]
            )
            
            db.session.add(new_log)
            db.session.commit()
            logging.info(f"Log inserted: {new_log.id}")

            # Run AI threat analysis in background thread
            def run_analysis(log, app):
                threat_level, risk_description = analyze_log(log.log_message, app)
                save_analysis(log.id, threat_level, risk_description, app) 

            
            threading.Thread(target=run_analysis, args=(new_log, app), daemon=True).start()

            # Emit new log event to clients via WebSocket
            socketio.emit('new_log', {
                'ip': new_log.ip,
                'timestamp': new_log.timestamp,
                'log_message': new_log.log_message,
                'original_source': new_log.original_source
            })
        
        
        except Exception as e:
            logging.error(f"Failed to insert log into DB: {e}")
            db.session.rollback()


class SyslogHandler(socketserver.BaseRequestHandler):
    def setup(self):
        self.app = self.server.app

    def handle(self):
        try:
            data = self.request[0].decode(errors="ignore").strip()
            client_ip = self.client_address[0]
            
            log_data = parse_log(data)

            if not log_data:
                logging.warning(f"Failed to parse log: {data}")

            insert_log(log_data, self.app)
        except Exception as e:
            logging.error(f"Syslog handling error: {e}")


class ThreadedUDPServer(socketserver.ThreadingMixIn, socketserver.UDPServer):
    def __init__(self, server_address, handler_class, app):
        super().__init__(server_address, handler_class)
        self.app = app


def run_syslog_listener(app, host="0.0.0.0", port=5515):
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    try:
        server = ThreadedUDPServer((host, port), SyslogHandler, app)
        logging.info(f"Syslog running on {host}:{port}")

        
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
    except Exception as e:
        logging.error(f"Failed syslog: {e}")



