from app import db  

class Logs(db.Model):
    __tablename__ = 'logs'
    id = db.Column(db.Integer, primary_key=True)  
    ip = db.Column(db.String(255)) 
    timestamp = db.Column(db.String(255))  
    original_source = db.Column(db.String(255))   
    log_message = db.Column(db.Text)  

