"""
Timetable API
==============
Endpoints for timetable viewing, creation, and management.
"""

from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

from ..services.timetable_service import TimetableService
from ..middleware.auth_middleware import role_required, resolve_student_identity
from ..extensions import db, redis_client

timetable_bp = Blueprint("timetable", __name__)
timetable_service = TimetableService()


@timetable_bp.route("/my-timetable", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def my_timetable():
    """Get timetable for logged-in student (Redis cached)."""
    from ..repositories.user_repo import UserRepository
    user = UserRepository().get_by_id(resolve_student_identity(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Provide defaults to prevent blank timetable screen
    dept = user.department or "CSE"
    sem = user.semester or 4
    sec = user.section or "A"
    
    day = request.args.get("day")
    result, error = timetable_service.get_student_timetable(dept, sem, sec, day)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(result), 200


@timetable_bp.route("/class", methods=["GET"])
@jwt_required()
def class_timetable():
    """Get timetable for any class. Params: department, semester, section, day."""
    dept = request.args.get("department")
    sem = request.args.get("semester", type=int)
    sec = request.args.get("section")
    if not all([dept, sem, sec]):
        return jsonify({"error": "department, semester, section required"}), 400
    result, error = timetable_service.get_student_timetable(dept, sem, sec, request.args.get("day"))
    if error:
        return jsonify({"error": error}), 404
    return jsonify(result), 200


@timetable_bp.route("/faculty", methods=["GET"])
@jwt_required()
@role_required("faculty", "admin")
def faculty_timetable():
    """Get timetable for logged-in faculty."""
    return jsonify(timetable_service.get_faculty_timetable(get_jwt_identity())), 200


@timetable_bp.route("/now", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def current_class():
    """Get current live / next upcoming class."""
    from ..repositories.user_repo import UserRepository
    user = UserRepository().get_by_id(resolve_student_identity(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    result = timetable_service.get_current_class(user.department, user.semester, user.section)
    return jsonify(result or {"message": "No classes found"}), 200


@timetable_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_timetable():
    """Create master timetable (admin only)."""
    data = request.get_json()
    required = ["name", "department", "semester", "section", "academic_year"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400
    result, error = timetable_service.create_timetable(get_jwt_identity(), data)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Timetable created", "timetable": result}), 201


@timetable_bp.route("/<timetable_id>/slot", methods=["POST"])
@jwt_required()
@role_required("admin")
def add_slot(timetable_id):
    """Add slot with conflict detection (admin only)."""
    data = request.get_json()
    required = ["day", "period_number", "start_time", "end_time"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400
    result, error = timetable_service.add_slot(timetable_id, data)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Slot added", "slot": result}), 201


@timetable_bp.route("/<timetable_id>/publish", methods=["POST"])
@jwt_required()
@role_required("admin")
def publish_timetable(timetable_id):
    """Publish timetable for students."""
    success, error = timetable_service.publish_timetable(timetable_id)
    if not success:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Timetable published"}), 200


@timetable_bp.route("/events", methods=["GET"])
def timetable_events():
    """Server-Sent Events route streaming live timetable cancellations and changes."""
    def event_stream():
        yield "data: {\"type\": \"connected\"}\n\n"
        pubsub = redis_client.pubsub()
        pubsub.subscribe("timetable_updates")
        try:
            for message in pubsub.listen():
                if message['type'] == 'message':
                    data = message['data'].decode('utf-8') if isinstance(message['data'], bytes) else message['data']
                    yield f"data: {data}\n\n"
        except Exception:
            # Fallback to keep-alive
            while True:
                import time
                time.sleep(15)
                yield "data: {\"type\": \"ping\"}\n\n"
    return Response(event_stream(), mimetype="text/event-stream")





@timetable_bp.route("/slot/<slot_id>/cancel", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def cancel_slot(slot_id):
    """Mark a class slot as cancelled and broadcast the update."""
    from ..models.timetable import TimetableSlot
    from ..models.user import User
    from ..models.campus import Notice

    slot = db.session.get(TimetableSlot, slot_id)
    if not slot:
        return jsonify({"error": "Slot not found"}), 404

    # Get optional cancel reason from request body
    reason = ""
    if request.is_json:
        data = request.get_json(silent=True) or {}
        reason = data.get("reason", "")

    slot.is_cancelled = True
    if reason:
        slot.remarks = f"Cancelled: {reason}"
    db.session.commit()

    faculty_id = get_jwt_identity()
    faculty = db.session.get(User, faculty_id)
    faculty_name = f"Prof. {faculty.last_name}" if faculty else "Faculty"

    # Get timetable info
    from ..models.timetable import Timetable
    timetable = db.session.get(Timetable, slot.timetable_id)
    branch = None
    year = None
    section = None
    target_audience = "all"
    if timetable:
        branch = timetable.department
        year = timetable.semester
        section = timetable.section
        target_audience = "class"

    day_str = slot.day.value.capitalize() if hasattr(slot.day, 'value') else str(slot.day).capitalize()
    start_str = slot.start_time.strftime('%H:%M') if hasattr(slot.start_time, 'strftime') else str(slot.start_time)
    end_str = slot.end_time.strftime('%H:%M') if hasattr(slot.end_time, 'strftime') else str(slot.end_time)

    content = f"The class for {slot.subject_name} ({slot.subject_code}) scheduled for {day_str} (Period {slot.period_number}, {start_str} - {end_str}) has been CANCELLED by {faculty_name}."
    if reason:
        content += f"\nReason: {reason}"

    # Create dynamic live banner message
    banner_msg = f"Class {slot.subject_name} ({slot.subject_code}) has been CANCELLED today."
    if reason:
        banner_msg += f" Reason: {reason}"

    update_data = {
        "type": "cancel",
        "slot_id": slot_id,
        "subject_code": slot.subject_code,
        "subject_name": slot.subject_name,
        "room_number": slot.room_number,
        "message": banner_msg
    }

    try:
        # Save to Notice database
        notice = Notice(
            title=f"CLASS CANCELLED: {slot.subject_code} - {slot.subject_name}",
            content=content,
            author_id=faculty_id,
            priority="high",
            target_audience=target_audience,
            is_pinned=True,
            branch=branch,
            year=year,
            section=section,
            media_json='[]',
            files_json='[]'
        )
        db.session.add(notice)
        db.session.commit()
    except Exception as e:
        # Don't fail the cancellation if notice insertion fails, but log it
        print("Error saving notice on cancellation:", e)
        db.session.rollback()

    try:
        if timetable:
            cache_key = f"timetable:{timetable.department}:{timetable.semester}:{timetable.section}"
            redis_client.delete(cache_key)
        redis_client.publish("timetable_updates", json.dumps(update_data))
    except Exception:
        pass

    return jsonify({"message": "Slot cancelled", "slot": slot.to_dict()}), 200


@timetable_bp.route("/slot/<slot_id>/substitute", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def substitute_slot(slot_id):
    """Assign substitute details to a slot and broadcast changes."""
    from ..models.timetable import TimetableSlot
    slot = db.session.get(TimetableSlot, slot_id)
    if not slot:
        return jsonify({"error": "Slot not found"}), 404

    data = request.get_json()
    sub_id = data.get("substitute_faculty_id")
    sub_name = data.get("substitute_faculty_name")
    new_room = data.get("room_number")

    if sub_id:
        slot.substitute_faculty_id = sub_id
    if sub_name:
        slot.faculty_name = sub_name
    if new_room:
        slot.room_number = new_room

    slot.remarks = data.get("remarks", "Substitute lecture arranged.")
    db.session.commit()

    update_data = {
        "type": "substitute",
        "slot_id": slot_id,
        "subject_code": slot.subject_code,
        "subject_name": slot.subject_name,
        "room_number": slot.room_number,
        "faculty_name": slot.faculty_name,
        "message": f"Class {slot.subject_name} substitute arranged: {slot.faculty_name} in {slot.room_number}."
    }

    try:
        from ..models.timetable import Timetable
        timetable = db.session.get(Timetable, slot.timetable_id)
        if timetable:
            cache_key = f"timetable:{timetable.department}:{timetable.semester}:{timetable.section}"
            redis_client.delete(cache_key)
        redis_client.publish("timetable_updates", json.dumps(update_data))
    except Exception:
        pass

    return jsonify({"message": "Substitute arranged", "slot": slot.to_dict()}), 200

