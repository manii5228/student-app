"""
Faculty API — Leave Approval, Meetings, Resources, Broadcast
"""

from datetime import datetime, timezone, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..middleware.auth_middleware import role_required
from ..models.career import LeaveRequest, MeetingSlot, Resource
from ..models.user import User

faculty_bp = Blueprint("faculty", __name__)


# ── Leave Approval System ──────────────────────────────────────────

@faculty_bp.route("/leaves", methods=["GET"])
@jwt_required()
@role_required("faculty", "admin")
def pending_leaves():
    """Faculty dashboard to review student leave applications."""
    # In a real system, you might filter by department or faculty advising groups
    leaves = LeaveRequest.query.filter_by(status="pending").order_by(LeaveRequest.created_at).all()
    return jsonify({"leaves": [l.to_dict() for l in leaves]}), 200


@faculty_bp.route("/leaves", methods=["POST"])
@jwt_required()
@role_required("student")
def apply_leave():
    """Student applies for leave."""
    data = request.get_json()
    leave = LeaveRequest(
        student_id=get_jwt_identity(),
        leave_type=data.get("leave_type", "casual"),
        from_date=date.fromisoformat(data["from_date"]),
        to_date=date.fromisoformat(data["to_date"]),
        reason=data["reason"],
    )
    db.session.add(leave)
    db.session.commit()
    return jsonify({"message": "Leave applied successfully", "leave": leave.to_dict()}), 201


@faculty_bp.route("/leaves/<lid>/approve", methods=["PUT"])
@jwt_required()
@role_required("faculty", "admin")
def approve_leave(lid):
    """Approve or reject leave application."""
    leave = db.session.get(LeaveRequest, lid)
    if not leave:
        return jsonify({"error": "Leave request not found"}), 404
    data = request.get_json()
    leave.status = data.get("status", "approved") # approved or rejected
    leave.reviewed_by = get_jwt_identity()
    leave.reviewed_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"message": f"Leave {leave.status}", "leave": leave.to_dict()}), 200


# ── Meeting Scheduler (Office Hours) ───────────────────────────────

@faculty_bp.route("/meetings/slots", methods=["GET"])
@jwt_required()
def list_meeting_slots():
    """Get available office hour slots for a specific faculty."""
    fid = request.args.get("faculty_id")
    if not fid:
        return jsonify({"error": "faculty_id is required"}), 400
    slots = MeetingSlot.query.filter_by(faculty_id=fid, is_booked=False, date=date.today()).all()
    return jsonify({"slots": [s.to_dict() for s in slots]}), 200


@faculty_bp.route("/meetings/slots", methods=["POST"])
@jwt_required()
@role_required("faculty")
def create_slots():
    """Faculty creates available meeting slots."""
    data = request.get_json()
    slots_created = []
    for slot_data in data.get("slots", []):
        slot = MeetingSlot(
            faculty_id=get_jwt_identity(),
            date=date.fromisoformat(slot_data["date"]),
            start_time=datetime.strptime(slot_data["start_time"], "%H:%M").time(),
            end_time=datetime.strptime(slot_data["end_time"], "%H:%M").time(),
        )
        db.session.add(slot)
        slots_created.append(slot)
    db.session.commit()
    return jsonify({"message": f"{len(slots_created)} slots created"}), 201


@faculty_bp.route("/meetings/slots/<sid>/book", methods=["POST"])
@jwt_required()
@role_required("student")
def book_meeting(sid):
    """Student books a meeting slot."""
    slot = db.session.get(MeetingSlot, sid)
    if not slot or slot.is_booked:
        return jsonify({"error": "Slot unavailable"}), 400
    data = request.get_json() or {}
    slot.is_booked = True
    slot.booked_by = get_jwt_identity()
    slot.purpose = data.get("purpose")
    db.session.commit()
    return jsonify({"message": "Slot booked", "slot": slot.to_dict()}), 200


# ── Resource Uploader ──────────────────────────────────────────────

@faculty_bp.route("/resources", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def upload_resource():
    """Upload lecture notes, PPTs, etc."""
    data = request.get_json()
    res = Resource(
        title=data["title"],
        description=data.get("description"),
        file_url=data["file_url"],
        file_type=data.get("file_type", "pdf"),
        subject_code=data.get("subject_code"),
        subject_name=data.get("subject_name"),
        department=data.get("department"),
        semester=data.get("semester"),
        uploaded_by=get_jwt_identity(),
    )
    db.session.add(res)
    db.session.commit()
    return jsonify({"message": "Resource uploaded", "resource": res.to_dict()}), 201


@faculty_bp.route("/resources", methods=["GET"])
@jwt_required()
def list_resources():
    """List available resources for students."""
    subject_code = request.args.get("subject_code")
    query = Resource.query
    if subject_code:
        query = query.filter_by(subject_code=subject_code)
    resources = query.order_by(Resource.created_at.desc()).all()
    return jsonify({"resources": [r.to_dict() for r in resources]}), 200


# ── Broadcast ──────────────────────────────────────────────────────

@faculty_bp.route("/broadcast", methods=["POST"])
@jwt_required()
@role_required("faculty")
def broadcast_message():
    """Send a notification to a specific class/batch."""
    # In a full implementation, this would trigger a push notification via Firebase/Celery
    data = request.get_json()
    # Log the broadcast (simplified)
    return jsonify({
        "message": "Broadcast sent",
        "target": data.get("target_class"),
        "content": data.get("message")
    }), 200


# ── Mentees ────────────────────────────────────────────────────────

@faculty_bp.route("/mentees", methods=["GET"])
@jwt_required()
@role_required("faculty")
def get_mentees():
    """Get students assigned to this faculty as mentor."""
    faculty_id = get_jwt_identity()
    mentees = User.query.filter_by(mentor_id=faculty_id, role="student").all()
    result = []
    for m in mentees:
        d = m.to_dict() if hasattr(m, 'to_dict') else {
            "id": m.id, "name": f"{m.first_name} {m.last_name}", "email": m.email,
            "register_number": getattr(m, 'roll_number', None),
            "department": getattr(m, 'department', None),
            "semester": getattr(m, 'semester', None),
        }
        result.append(d)
    return jsonify({"mentees": result, "total": len(result)}), 200


@faculty_bp.route("/mentees/performance", methods=["GET"])
@jwt_required()
@role_required("faculty")
def mentee_performance():
    """Get attendance/marks summary for mentees."""
    from ..models.attendance import Attendance
    faculty_id = get_jwt_identity()
    mentees = User.query.filter_by(mentor_id=faculty_id, role="student").all()
    summary = []
    for m in mentees:
        total = Attendance.query.filter_by(student_id=m.id).count()
        present = Attendance.query.filter_by(student_id=m.id, status="present").count()
        pct = round(present / total * 100) if total else 0
        summary.append({
            "id": m.id, "name": f"{m.first_name} {m.last_name}",
            "register_number": getattr(m, 'roll_number', None),
            "department": getattr(m, 'department', None),
            "attendance_pct": pct, "total_classes": total,
        })
    return jsonify({"mentees": summary}), 200
