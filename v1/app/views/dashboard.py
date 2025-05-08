from flask import Blueprint, render_template, request

# Define the blueprint for the dashboard views
dashboard_bp = Blueprint('dashboard', __name__)

# Route for the homepage
@dashboard_bp.route("/")
def index():
    return render_template("index.html")

# Route for the "About Us" page
@dashboard_bp.route("/about-us")
def about_us():
    return render_template("about_us.html")
