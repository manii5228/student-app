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
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    
    query = LeaveRequest.query.filter_by(status="pending")
    
    if user.role.value == "faculty":
        query = query.join(User, LeaveRequest.student_id == User.id).filter(
            User.department == user.department,
            User.semester == user.semester,
            User.section == user.section
        )
        
    leaves = query.order_by(LeaveRequest.created_at).all()
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
    """Get available office hour slots for a specific faculty or automatically for the student's assigned faculty."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    
    fid = request.args.get("faculty_id")
    if not fid:
        if user.role.value == "student":
            # Find faculty assigned to this student's class
            faculties = User.query.filter_by(
                role="faculty",
                department=user.department,
                semester=user.semester,
                section=user.section
            ).all()
            if not faculties:
                return jsonify({"slots": []}), 200
            fid_list = [f.id for f in faculties]
            slots = MeetingSlot.query.filter(
                MeetingSlot.faculty_id.in_(fid_list),
                MeetingSlot.is_booked == False
            ).all()
            slot_list = []
            for s in slots:
                d = s.to_dict()
                fac = db.session.get(User, s.faculty_id)
                if fac:
                    d["faculty_name"] = fac.full_name
                    d["faculty_email"] = fac.email
                slot_list.append(d)
            return jsonify({"slots": slot_list}), 200
        elif user.role.value == "faculty":
            # For faculty, fetch their own slots and attach student details if booked
            slots = MeetingSlot.query.filter_by(faculty_id=user_id).all()
            slot_list = []
            for s in slots:
                d = s.to_dict()
                if s.is_booked and s.booked_by:
                    student = db.session.get(User, s.booked_by)
                    if student:
                        d["student_name"] = student.full_name
                        d["student_email"] = student.email
                        d["student_roll"] = student.roll_number
                slot_list.append(d)
            return jsonify({"slots": slot_list}), 200
        else:
            return jsonify({"error": "faculty_id is required"}), 400
            
    # If specific faculty_id is passed, get their available slots
    slots = MeetingSlot.query.filter_by(faculty_id=fid, is_booked=False).all()
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


@faculty_bp.route("/meetings/slots/auto-fill", methods=["POST"])
@jwt_required()
@role_required("faculty")
def auto_fill_slots():
    """Auto-fill 1-hour office slots for a date by checking faculty timetable."""
    data = request.get_json()
    if not data or not data.get("date"):
        return jsonify({"error": "date is required"}), 400
        
    date_str = data["date"]
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "Invalid date format, use YYYY-MM-DD"}), 400
        
    # Get day of week
    day_name = target_date.strftime("%A").lower()  # monday, tuesday...
    
    from ..models.timetable import TimetableSlot, DayOfWeek
    try:
        day_enum = DayOfWeek(day_name)
    except ValueError:
        return jsonify({"error": f"Invalid day of week for date {date_str}"}), 400
        
    faculty_id = get_jwt_identity()
    
    # Query all active timetable slots for this faculty on this day
    class_slots = TimetableSlot.query.filter_by(
        faculty_id=faculty_id,
        day=day_enum,
        is_cancelled=False
    ).all()
    
    # Define standard 1-hour slots from 09:00 to 17:00
    from datetime import time
    standard_slots = [
        ("09:00", "10:00", time(9, 0), time(10, 0)),
        ("10:00", "11:00", time(10, 0), time(11, 0)),
        ("11:00", "12:00", time(11, 0), time(12, 0)),
        ("12:00", "13:00", time(12, 0), time(13, 0)),
        ("13:00", "14:00", time(13, 0), time(14, 0)),
        ("14:00", "15:00", time(14, 0), time(15, 0)),
        ("15:00", "16:00", time(15, 0), time(16, 0)),
        ("16:00", "17:00", time(16, 0), time(17, 0)),
    ]
    
    available_slots = []
    
    for start_str, end_str, start_time, end_time in standard_slots:
        overlap = False
        for c in class_slots:
            if c.start_time and c.end_time:
                # check if start_time/end_time overlaps with class
                if not (end_time <= c.start_time or start_time >= c.end_time):
                    overlap = True
                    break
        if not overlap:
            existing = MeetingSlot.query.filter_by(
                faculty_id=faculty_id,
                date=target_date,
                start_time=start_time,
                end_time=end_time
            ).first()
            if not existing:
                available_slots.append({
                    "date": date_str,
                    "start_time": start_str,
                    "end_time": end_str
                })
                
    return jsonify({"suggested_slots": available_slots}), 200


@faculty_bp.route("/meetings/booked", methods=["GET"])
@jwt_required()
@role_required("faculty")
def get_booked_meetings():
    """Get list of booked meetings for the faculty."""
    faculty_id = get_jwt_identity()
    booked = MeetingSlot.query.filter_by(faculty_id=faculty_id, is_booked=True).order_by(MeetingSlot.date.desc(), MeetingSlot.start_time.desc()).all()
    
    result = []
    for slot in booked:
        student_obj = db.session.get(User, slot.booked_by)
        result.append({
            "id": slot.id,
            "date": slot.date.isoformat(),
            "start_time": slot.start_time.strftime("%H:%M"),
            "end_time": slot.end_time.strftime("%H:%M"),
            "purpose": slot.purpose,
            "student_name": student_obj.full_name if student_obj else "Student",
            "student_email": student_obj.email if student_obj else "N/A",
            "student_roll": student_obj.roll_number if student_obj else "N/A"
        })
    return jsonify({"meetings": result}), 200


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
@role_required("faculty", "admin")
def broadcast_message():
    """Send a notification to a specific class/batch and save it as a notice."""
    from ..models.campus import Notice
    import json
    data = request.get_json()
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    
    target = data.get("target_class")
    content = data.get("message")
    title = data.get("title", f"Class Broadcast from Prof. {user.last_name}")
    
    # Enforce faculty can only broadcast to their assigned class
    branch = None
    year = None
    section = None
    target_audience = "all"
    
    if user.role.value == "faculty":
        assigned_target = f"{user.department}-{user.section} Sem {user.semester}"
        if target != assigned_target and target != "All Students": # UI sends these formats
            return jsonify({"error": f"You are only authorized to broadcast to your assigned class ({assigned_target})."}), 403
            
        if target == assigned_target:
            branch = user.department
            year = user.semester
            section = user.section
            target_audience = "class"
    else:
        # Admin can target anything, parse target class if in format DEPT-SEC Sem SEM
        if target and target != "All Students":
            try:
                parts = target.split(" Sem ")
                dept_sec = parts[0].split("-")
                branch = dept_sec[0]
                section = dept_sec[1] if len(dept_sec) > 1 else None
                year = int(parts[1])
                target_audience = "class"
            except Exception:
                pass

    # Save to Notice database so students see it!
    files = data.get("files", [])
    files_json = json.dumps(files)
    priority = data.get("priority", "high")
    
    notice = Notice(
        title=title,
        content=content,
        author_id=user_id,
        priority=priority,
        target_audience=target_audience,
        is_pinned=True,
        branch=branch,
        year=year,
        section=section,
        media_json='[]',
        files_json=files_json
    )
    db.session.add(notice)
    db.session.commit()

    return jsonify({
        "message": "Broadcast sent and notice board updated",
        "target": target,
        "content": content,
        "notice": notice.to_dict()
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


@faculty_bp.route("/class-students", methods=["GET"])
@jwt_required()
@role_required("faculty", "admin")
def get_class_students():
    """Get all students in the faculty's assigned class/section."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    
    query = User.query.filter_by(role="student")
    if user.role.value == "faculty":
        query = query.filter_by(
            department=user.department,
            semester=user.semester,
            section=user.section
        )
    students = query.order_by(User.first_name).all()
    return jsonify({"students": [
        {
            "id": s.id,
            "name": s.full_name,
            "email": s.email,
            "roll_number": s.roll_number,
            "department": s.department,
            "semester": s.semester,
            "section": s.section
        } for s in students
    ]}), 200


@faculty_bp.route("/assignments", methods=["GET"])
@jwt_required()
@role_required("faculty")
def get_faculty_assignments():
    """Get the active coordinator assignments for the logged-in faculty member."""
    fid = get_jwt_identity()
    
    from ..models.user import CoordinatorAssignment
    assignments = CoordinatorAssignment.query.filter_by(faculty_id=fid).all()
    
    # Auto-seed defaults if none exist (so it works immediately for testing)
    if not assignments:
        default_keys = ["syllabus_tracker", "internal_marks", "job_portal", "interview_schedule"]
        for key in default_keys:
            a = CoordinatorAssignment(faculty_id=fid, feature_key=key)
            db.session.add(a)
        db.session.commit()
        assignments = CoordinatorAssignment.query.filter_by(faculty_id=fid).all()
        
    assigned_features = [a.feature_key for a in assignments]
    
    # Track faculty assignments fetching for dashboard layout alignment and authorization
    # Query clubs advisor matches
    from ..models.campus import Club
    clubs = Club.query.filter_by(faculty_advisor_id=fid).all()
    assigned_clubs = [c.id for c in clubs]
    
    return jsonify({
        "assigned_features": assigned_features,
        "assigned_clubs": assigned_clubs
    }), 200

