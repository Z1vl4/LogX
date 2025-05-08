from app import db  

from sqlalchemy import CheckConstraint


class AnalysisResults(db.Model):
    __tablename__ = 'analysis_results'
    analysis_id = db.Column(db.Integer, primary_key=True)
    log_id = db.Column(db.Integer, db.ForeignKey('logs.id'), nullable=False)
    threat_level = db.Column(db.Integer, nullable=False)
    risk_description = db.Column(db.Text, nullable=False)

    __table_args__ = (
        CheckConstraint('threat_level BETWEEN 1 AND 10', name='check_threat_level'),
    )

    