"""
Health & Utility API — Health Center, Emergency Alerts, Polls & Surveys, Buy & Sell Marketplace
"""

import json
from datetime import datetime, timezone, date as dt_date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..middleware.auth_middleware import role_required
from ..models.campus import (
    HealthAppointment, EmergencyAlert, Poll, PollVote, MarketListing
)

utility_bp = Blueprint("utility", __name__)


# ── Health Center ──────────────────────────────────────────────────

@utility_bp.route("/health/appointments", methods=["GET"])
@jwt_required()
def my_appointments():
    """Get student's health appointments."""
    appts = HealthAppointment.query.filter_by(student_id=get_jwt_identity())\
        .order_by(HealthAppointment.preferred_date.desc()).all()
    return jsonify({"appointments": [a.to_dict() for a in appts]}), 200


@utility_bp.route("/health/appointments", methods=["POST"])
@jwt_required()
@role_required("student")
def book_appointment():
    """Book a health center appointment."""
    data = request.get_json()
    appt = HealthAppointment(
        student_id=get_jwt_identity(),
        appointment_type=data.get("appointment_type", "general"),
        description=data.get("description"),
        preferred_date=dt_date.fromisoformat(data["preferred_date"].split("T")[0]),
        preferred_time=data.get("preferred_time", "morning"),
    )
    db.session.add(appt)
    db.session.commit()
    return jsonify({"message": "Appointment booked", "appointment": appt.to_dict()}), 201


@utility_bp.route("/health/appointments/<aid>/cancel", methods=["POST"])
@jwt_required()
def cancel_appointment(aid):
    """Cancel an appointment."""
    appt = db.session.get(HealthAppointment, aid)
    if not appt or appt.student_id != get_jwt_identity():
        return jsonify({"error": "Not found"}), 404
    appt.status = "cancelled"
    db.session.commit()
    return jsonify({"message": "Cancelled"}), 200


@utility_bp.route("/health/appointments/<aid>/status", methods=["PUT"])
@jwt_required()
@role_required("admin", "faculty")
def update_appointment_status(aid):
    """Update appointment status (admin/doctor)."""
    appt = db.session.get(HealthAppointment, aid)
    if not appt:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json()
    appt.status = data.get("status", appt.status)
    appt.notes = data.get("notes", appt.notes)
    appt.doctor_name = data.get("doctor_name", appt.doctor_name)
    db.session.commit()
    return jsonify({"appointment": appt.to_dict()}), 200


# ── Emergency Alert ────────────────────────────────────────────────

@utility_bp.route("/emergency", methods=["POST"])
@jwt_required()
def send_emergency():
    """One-tap alert to campus security/ambulance."""
    data = request.get_json()
    alert = EmergencyAlert(
        student_id=get_jwt_identity(),
        alert_type=data.get("alert_type", "medical"),
        message=data.get("message"),
        location=data.get("location"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
    )
    db.session.add(alert)
    db.session.commit()
    return jsonify({"message": "Emergency alert sent!", "alert": alert.to_dict()}), 201


@utility_bp.route("/emergency/my-alerts", methods=["GET"])
@jwt_required()
def my_alerts():
    """Get student's emergency alert history."""
    alerts = EmergencyAlert.query.filter_by(student_id=get_jwt_identity())\
        .order_by(EmergencyAlert.created_at.desc()).limit(20).all()
    return jsonify({"alerts": [a.to_dict() for a in alerts]}), 200


@utility_bp.route("/emergency/active", methods=["GET"])
@jwt_required()
@role_required("admin", "faculty")
def active_alerts():
    """Get all active emergency alerts (admin/security)."""
    alerts = EmergencyAlert.query.filter_by(status="active")\
        .order_by(EmergencyAlert.created_at.desc()).all()
    return jsonify({"alerts": [a.to_dict() for a in alerts]}), 200


@utility_bp.route("/emergency/<aid>/resolve", methods=["POST"])
@jwt_required()
@role_required("admin", "faculty")
def resolve_alert(aid):
    """Resolve an emergency alert."""
    alert = db.session.get(EmergencyAlert, aid)
    if not alert:
        return jsonify({"error": "Not found"}), 404
    alert.status = "resolved"
    alert.acknowledged_by = get_jwt_identity()
    alert.resolved_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"message": "Alert resolved"}), 200


# ── Polls & Surveys ───────────────────────────────────────────────

@utility_bp.route("/polls", methods=["GET"])
@jwt_required()
def list_polls():
    """List active polls."""
    polls = Poll.query.filter_by(is_active=True)\
        .order_by(Poll.created_at.desc()).limit(50).all()
    uid = get_jwt_identity()
    result = []
    for p in polls:
        d = p.to_dict()
        vote = PollVote.query.filter_by(poll_id=p.id, student_id=uid).first()
        d["user_voted"] = vote is not None
        d["user_vote_index"] = vote.option_index if vote else None
        options = json.loads(p.options_json) if p.options_json else []
        vote_counts = []
        for i in range(len(options)):
            count = PollVote.query.filter_by(poll_id=p.id, option_index=i).count()
            vote_counts.append(count)
        d["vote_counts"] = vote_counts
        result.append(d)
    return jsonify({"polls": result}), 200


@utility_bp.route("/polls", methods=["POST"])
@jwt_required()
@role_required("admin", "faculty")
def create_poll():
    """Create a new poll."""
    data = request.get_json()
    p = Poll(
        title=data["title"], description=data.get("description"),
        options_json=json.dumps(data["options"]),
        created_by=get_jwt_identity(),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify({"message": "Poll created", "poll": p.to_dict()}), 201


@utility_bp.route("/polls/<pid>/vote", methods=["POST"])
@jwt_required()
def vote_poll(pid):
    """Vote on a poll."""
    uid = get_jwt_identity()
    existing = PollVote.query.filter_by(poll_id=pid, student_id=uid).first()
    if existing:
        return jsonify({"error": "Already voted"}), 400
    data = request.get_json()
    vote = PollVote(
        poll_id=pid, student_id=uid,
        option_index=data["option_index"],
    )
    db.session.add(vote)
    poll = db.session.get(Poll, pid)
    if poll:
        poll.total_votes = (poll.total_votes or 0) + 1
    db.session.commit()
    return jsonify({"message": "Vote recorded"}), 201


# ── Buy & Sell Marketplace ────────────────────────────────────────

@utility_bp.route("/marketplace", methods=["GET"])
@jwt_required()
def browse_marketplace():
    """Browse marketplace listings."""
    cat = request.args.get("category")
    query = MarketListing.query.filter_by(is_sold=False)
    if cat:
        query = query.filter_by(category=cat)
    items = query.order_by(MarketListing.created_at.desc()).limit(50).all()
    return jsonify({"listings": [i.to_dict() for i in items]}), 200


@utility_bp.route("/marketplace", methods=["POST"])
@jwt_required()
@role_required("student")
def post_listing():
    """Post an item for sale."""
    data = request.get_json()
    listing = MarketListing(
        seller_id=get_jwt_identity(), title=data["title"],
        description=data.get("description"), price=data["price"],
        category=data.get("category", "books"),
        condition=data.get("condition", "good"),
    )
    db.session.add(listing)
    db.session.commit()
    return jsonify({"message": "Listed", "listing": listing.to_dict()}), 201


@utility_bp.route("/marketplace/<lid>/sold", methods=["POST"])
@jwt_required()
def mark_sold(lid):
    """Mark a listing as sold."""
    listing = db.session.get(MarketListing, lid)
    if not listing or listing.seller_id != get_jwt_identity():
        return jsonify({"error": "Not found"}), 404
    listing.is_sold = True
    db.session.commit()
    return jsonify({"message": "Marked as sold"}), 200
