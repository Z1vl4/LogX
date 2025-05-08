from openai import OpenAI, OpenAIError
from app.models.analysis_results import AnalysisResults
from app.models.logs import Logs
from app import db

import json
import logging

# Initialize OpenAI client (use environment variable for API key in production)
client = OpenAI(api_key="YOUR_API_KEY")

# Analyze a log message using OpenAI API
def analyze_log(log_message, app):
    with app.app_context():
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Analyze log and return a JSON {\"threat_level\": 1-10, \"description\": \"Risk summary\"}"},
                    {"role": "user", "content": f"Log: {log_message}"}
                ]
            )

            ai_content = response.choices[0].message.content.strip()

            # Clean up JSON formatting
            ai_content = ai_content.strip("```json").strip("```").strip()

            # Ensure it is a valid JSON structure
            if not ai_content.startswith("{") or not ai_content.endswith("}"):
                logging.error(f"AI response format invalid: {ai_content}")
                return 1, "Invalid AI response format"

            parsed_result = json.loads(ai_content)  

            return parsed_result.get("threat_level", 1), parsed_result.get("description", "Error during AI analysis")

        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse AI response: {e}")
            return 1, "Error parsing AI response"
        except Exception as e:
            logging.error(f"AI analysis failed: {e}")
            return 1, "Error during AI analysis"


# Save AI analysis results to the database
def save_analysis(log_id, threat_level, risk_description, app):
    with app.app_context():

        analysis = AnalysisResults.query.filter_by(log_id=log_id).first()
        
        if analysis:
            logging.warning(f"Analysis for log_id {log_id} already exists. Updating instead.")
            analysis.threat_level = threat_level
            analysis.risk_description = risk_description
        else:
            analysis = AnalysisResults(
                log_id=log_id,
                threat_level=threat_level,
                risk_description=risk_description
            )
            db.session.add(analysis)

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()



# Update analysis if it already exists
def update_analysis(log_id, threat_level, risk_description, app):
    with app.app_context():
        analysis = AnalysisResults.query.filter_by(log_id=log_id).first()
        if analysis:
            analysis.threat_level = threat_level
            analysis.risk_description = risk_description
            db.session.commit()
        else:
            logging.error(f"No analysis result entry found for log ID: {log_id}")

