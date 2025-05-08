from datetime import datetime
from pysnmp.entity.engine import SnmpEngine
from pysnmp.carrier.asyncio.dgram import udp
from pysnmp.entity.rfc3413 import ntfrcv
from pysnmp.entity import config
from app.models.logs import Logs
from app import db
from app.presenter.ai_parser import analyze_log, save_analysis

import threading
import asyncio
import logging

# Listener settings (replace with environment variables in production)
TRAP_AGENT_ADDRESS = "0.0.0.0" # Listening interface
TRAP_PORT = 1162               # Listening port
SNMP_COMMUNITY = "YOUR_COMMUNITY_STRING"       # Replace before deployment

# Configure logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")

def parse_snmp_log(varBinds):
    # Extract timestamp, IP, and message from SNMP varBinds
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ip = None
    log_message = None

    
    for name, val in varBinds:
        if "1.3.6.1.6.3.18.1.3.0" in name.prettyPrint(): 
            ip = val.prettyPrint()
        elif "1.3.6.1.4.1.55062.1.12.1.103.0" in name.prettyPrint():
            log_message = val.prettyPrint()

    if ip and log_message:
        parsed_log = {
            "timestamp": timestamp,
            "ip": ip,
            "log_message": log_message,
            "original_source": "SNMP"
        }
       
        return parsed_log
    else:
        logging.error("Log parsing failed: Unable to find IP or log message.")
        return None

def insert_log(log_data, app):
    # Insert log into database, skip if duplicate
    if not log_data:
        logging.warning("Skipping log insertion due to missing data.")
        return

    
    
    with app.app_context():
        try:
            # Check for duplicate entry
            existing_log = Logs.query.filter_by(
                ip=log_data["ip"],
                timestamp=log_data["timestamp"],
                log_message=log_data["log_message"],
                original_source=log_data["original_source"]
            ).first()
            #ev ta bort
            if existing_log:
                logging.warning(f"Duplicate log detected for {log_data['ip']}. Skipping insertion.")
                return

            # Insert new log
            new_log = Logs(**log_data)
            db.session.add(new_log)
            db.session.commit()
            logging.info(f" Log inserted: {new_log.id}")

            # Start AI analysis in background 
            def run_analysis(log, app):
                threat_level, risk_description = analyze_log(log.log_message, app)
                save_analysis(log.id, threat_level, risk_description, app)  

           
            threading.Thread(target=run_analysis, args=(new_log, app), daemon=True).start()

        except Exception as e:
            logging.error(f"Failed to insert log into DB: {e}")

def cbFun(snmpEngine, stateReference, contextEngineId, contextName, varBinds, cbCtx, app):
    # Callback triggered when a trap is received
    parsed_log = parse_snmp_log(varBinds)
    if parsed_log:
        insert_log(parsed_log, app)

def run_snmp_listener(app):
    # Start SNMP trap listener
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    snmpEngine = SnmpEngine()

    # Configure transport to listen on UDP
    config.add_transport(
        snmpEngine,
        udp.DOMAIN_NAME,
        udp.UdpTransport().open_server_mode((TRAP_AGENT_ADDRESS, TRAP_PORT))
    )

    # Configure SNMPv1 community string
    config.add_v1_system(snmpEngine, "my-area", SNMP_COMMUNITY)

    # Register notification handler
    ntfrcv.NotificationReceiver(snmpEngine, lambda snmpEngine, stateReference, contextEngineId, contextName, varBinds, cbCtx: cbFun(snmpEngine, stateReference, contextEngineId, contextName, varBinds, cbCtx, app))

    logging.info(f"SNMP started on {TRAP_AGENT_ADDRESS}:{TRAP_PORT}")

    # Start async event loop
    loop.run_forever()
