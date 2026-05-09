"""
Health & Utility API — Health Center, Emergency, Utilities, Fees
"""

from datetime import datetime, timezone, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..middleware.auth_middleware import role_required
from ..models.career import HealthAppointment, EmergencyAlert, FeeRecord

utility_bp = Blueprint("utility", __name__)


# ── Health Center ──────────────────────────────────────────────────

@utility_bp.route("/health/appointments", methods=["POST"])
@jwt_required()
@role_required("student")
def book_appointment():
    """Book an appointment at the campus clinic."""
    data = request.get_json()
    appt = HealthAppointment(
        student_id=get_jwt_identity(),
        appointment_date=date.fromisoformat(data["date"]),
        appointment_time=datetime.strptime(data["time"], "%H:%M").time(),
        reason=data.get("reason"),
    )
    db.session.add(appt)
    db.session.commit()
    return jsonify({"message": "Appointment booked", "appointment": appt.to_dict()}), 201


@utility_bp.route("/health/appointments", methods=["GET"])
@jwt_required()
def my_appointments():
    """Get upcoming appointments."""
    appts = HealthAppointment.query.filter_by(student_id=get_jwt_identity())\
        .order_by(HealthAppointment.appointment_date, HealthAppointment.appointment_time).all()
    return jsonify({"appointments": [a.to_dict() for a in appts]}), 200


# ── Emergency Button ───────────────────────────────────────────────

@utility_bp.route("/emergency", methods=["POST"])
@jwt_required()
def trigger_emergency():
    """One-tap alert to campus security/ambulance."""
    data = request.get_json() or {}
    alert = EmergencyAlert(
        user_id=get_jwt_identity(),
        alert_type=data.get("alert_type", "sos"),
        location_lat=data.get("lat"),
        location_lng=data.get("lng"),
    )
    db.session.add(alert)
    db.session.commit()
    # In a full system, this would push a socket/SMS alert to security
    return jsonify({"message": "Emergency alert triggered", "alert": alert.to_dict()}), 201


# ── Fee Management ─────────────────────────────────────────────────

@utility_bp.route("/fees", methods=["GET"])
@jwt_required()
@role_required("student")
def my_fees():
    """Track pending fee payments."""
    fees = FeeRecord.query.filter_by(student_id=get_jwt_identity()).all()
    return jsonify({"fees": [f.to_dict() for f in fees]}), 200


@utility_bp.route("/fees/bulk-assign", methods=["POST"])
@jwt_required()
@role_required("admin")
def assign_fees():
    """Admin assigns fees to students."""
    data = request.get_json()
    # Assume data contains a list of student IDs, fee_type, amount, due_date
    student_ids = data.get("student_ids", [])
    assigned = 0
    due_date = date.fromisoformat(data["due_date"]) if data.get("due_date") else None
    
    for sid in student_ids:
        fee = FeeRecord(
            student_id=sid,
            fee_type=data["fee_type"],
            amount=data["amount"],
            semester=data.get("semester"),
            due_date=due_date,
        )
        db.session.add(fee)
        assigned += 1
    db.session.commit()
    return jsonify({"message": f"Assigned {data['fee_type']} to {assigned} students"}), 201


@utility_bp.route("/fees/<fid>/pay", methods=["POST"])
@jwt_required()
@role_required("student")
def pay_fee(fid):
    """Simulate fee payment."""
    fee = db.session.get(FeeRecord, fid)
    if not fee or fee.student_id != get_jwt_identity():
        return jsonify({"error": "Fee record not found"}), 404
    
    # Mocking payment processing
    fee.status = "paid"
    fee.paid_date = date.today()
    fee.transaction_id = f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}"
    db.session.commit()
    return jsonify({"message": "Payment successful", "fee": fee.to_dict()}), 200
