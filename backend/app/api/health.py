"""
Health Check API
=================
System health and readiness endpoints.
"""

from flask import Blueprint, jsonify
from ..extensions import db, redis_client

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """Basic health check — returns server status."""
    status = {"status": "healthy", "service": "VelTech Super-App API", "version": "1.0.0"}

    # Check DB
    try:
        db.session.execute(db.text("SELECT 1"))
        status["database"] = "connected"
    except Exception as e:
        status["database"] = f"error: {str(e)}"
        status["status"] = "degraded"

    # Check Redis
    try:
        redis_client.ping()
        status["redis"] = "connected"
    except Exception:
        status["redis"] = "unavailable"
        status["status"] = "degraded"

    code = 200 if status["status"] == "healthy" else 503
    return jsonify(status), code


@health_bp.route("/ready", methods=["GET"])
def readiness_check():
    """Kubernetes readiness probe."""
    try:
        db.session.execute(db.text("SELECT 1"))
        return jsonify({"ready": True}), 200
    except Exception:
        return jsonify({"ready": False}), 503
