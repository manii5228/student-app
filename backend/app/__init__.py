"""
VelTech University Super-App — Flask Application Factory
=========================================================
Centralized digital ecosystem for 15,000+ students, faculty, and staff.
Follows the Repository Pattern for database-swappable architecture.
"""

import os
from flask import Flask
from flask_cors import CORS

from .config import config_map
from .extensions import db, migrate, jwt, redis_client, limiter


def create_app(config_name=None):
    """Application factory — creates and configures the Flask app."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_map[config_name])

    # ── Initialize Extensions ──────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    CORS(app, resources={r"/api/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "supports_credentials": True
    }})

    # ── Initialize Redis ───────────────────────────────────────────
    redis_client.init_app(app)

    # ── Register Blueprints ────────────────────────────────────────
    from .api.auth import auth_bp
    from .api.attendance import attendance_bp
    from .api.timetable import timetable_bp
    from .api.admin import admin_bp
    from .api.health import health_bp
    from .api.academic import academic_bp
    from .api.campus import campus_bp
    from .api.career import career_bp
    from .api.faculty import faculty_bp
    from .api.health_utility import utility_bp

    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(attendance_bp, url_prefix="/api/v1/attendance")
    app.register_blueprint(timetable_bp, url_prefix="/api/v1/timetable")
    app.register_blueprint(admin_bp, url_prefix="/api/v1/admin")
    app.register_blueprint(academic_bp, url_prefix="/api/v1/academic")
    app.register_blueprint(campus_bp, url_prefix="/api/v1/campus")
    app.register_blueprint(career_bp, url_prefix="/api/v1/career")
    app.register_blueprint(faculty_bp, url_prefix="/api/v1/faculty")
    app.register_blueprint(utility_bp, url_prefix="/api/v1/utility")

    # ── JWT Error Handlers ─────────────────────────────────────────
    @jwt.token_in_blocklist_loader
    def check_if_token_is_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        token_in_redis = redis_client.get(f"token_blocklist:{jti}")
        return token_in_redis is not None

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {"error": "Token has expired", "code": "TOKEN_EXPIRED"}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {"error": "Invalid token", "code": "TOKEN_INVALID"}, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {"error": "Authorization required", "code": "AUTH_REQUIRED"}, 401

    # ── Shell Context ──────────────────────────────────────────────
    @app.shell_context_processor
    def make_shell_context():
        from .models.user import User
        from .models.attendance import Attendance
        from .models.timetable import Timetable, TimetableSlot
        return {
            "db": db, "User": User,
            "Attendance": Attendance,
            "Timetable": Timetable, "TimetableSlot": TimetableSlot,
        }

    return app
