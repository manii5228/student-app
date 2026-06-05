"""
Attendance API
===============
Endpoints for attendance sessions, bulk marking, QR attendance,
offline sync, and Bunk-O-Meter.
"""

from datetime import date

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from ..services.attendance_service import AttendanceService
from ..middleware.auth_middleware import role_required, resolve_student_identity

attendance_bp = Blueprint("attendance", __name__)
attendance_service = AttendanceService()


# ── Create Session (Faculty Only) ──────────────────────────────────

@attendance_bp.route("/session", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def create_session():
    """
    Create a new attendance session.
    
    Body: {
        "subject_code": "CS301",
        "subject_name": "Data Structures",
        "department": "CSE",
        "semester": 3,
        "section": "A",
        "period_number": 1,
        "session_date": "2026-05-09"  (optional, defaults to today)
    }
    """
    data = request.get_json()
    faculty_id = get_jwt_identity()

    required = ["subject_code", "subject_name", "department", "semester",
                "section", "period_number"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400

    # Parse date if provided
    if "session_date" in data and isinstance(data["session_date"], str):
        data["session_date"] = date.fromisoformat(data["session_date"])

    result, error = attendance_service.create_session(faculty_id, data)
    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Session created", "session": result}), 201


# ── Bulk Mark Attendance (Faculty) ─────────────────────────────────

@attendance_bp.route("/session/<session_id>/bulk", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def bulk_mark(session_id):
    """
    Bulk mark attendance — faculty marks all present, then toggles absentees.
    
    Body: {
        "records": [
            {"student_id": "uuid1", "status": "present"},
            {"student_id": "uuid2", "status": "absent"},
            {"student_id": "uuid3", "status": "late"}
        ]
    }
    """
    data = request.get_json()
    faculty_id = get_jwt_identity()

    if "records" not in data or not isinstance(data["records"], list):
        return jsonify({"error": "records list required"}), 400

    result, error = attendance_service.bulk_mark_attendance(
        session_id, faculty_id, data["records"],
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Attendance marked", "result": result}), 200


# ── Generate QR (Faculty) ─────────────────────────────────────────

@attendance_bp.route("/session/<session_id>/qr", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def generate_qr(session_id):
    """
    Generate a time-locked QR token for student check-in.
    Body: {"latitude": 13.123, "longitude": 80.123}
    """
    faculty_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    lat = data.get("latitude")
    lng = data.get("longitude")

    # Fallback to default campus coordinates if GPS coordinates are missing or invalid
    if lat is None or lng is None:
        import logging
        logging.info(f"[QR Attendance] Geolocation not provided or invalid for faculty_id: {faculty_id}. Falling back to default VelTech campus coordinates (13.1818, 80.0401).")
        lat = 13.1818
        lng = 80.0401

    result, error = attendance_service.generate_qr_token(session_id, faculty_id, lat, lng)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(result), 200


# ── Scan QR (Student) ─────────────────────────────────────────────

@attendance_bp.route("/scan-qr", methods=["POST"])
@jwt_required()
@role_required("student")
def scan_qr():
    """
    Student scans QR code to mark attendance.
    Body: {"qr_token": "...", "latitude": 13.123, "longitude": 80.123}
    """
    data = request.get_json()
    student_id = get_jwt_identity()
    qr_token = data.get("qr_token")
    lat = data.get("latitude")
    lng = data.get("longitude")

    if not qr_token:
        return jsonify({"error": "QR token required"}), 400

    result, error = attendance_service.scan_qr_attendance(qr_token, student_id, lat, lng)
    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Attendance marked via QR", "result": result}), 200


# ── Offline Sync ───────────────────────────────────────────────────

@attendance_bp.route("/sync", methods=["POST"])
@jwt_required()
def sync_offline():
    """
    Sync attendance records captured offline.
    Body: {
        "records": [
            {"session_id": "...", "student_id": "...", "status": "present",
             "client_timestamp": "..."}
        ]
    }
    """
    data = request.get_json()
    records = data.get("records", [])

    if not records:
        return jsonify({"error": "No records to sync"}), 400

    result = attendance_service.sync_offline_attendance(records)
    return jsonify({"message": "Sync complete", "result": result}), 200


# ── Bunk-O-Meter (Student) ────────────────────────────────────────

@attendance_bp.route("/bunk-o-meter", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def bunk_o_meter():
    """
    Get attendance summary and bunkable classes.
    Query params: ?subject_code=CS301 (optional)
    """
    student_id = resolve_student_identity(get_jwt_identity())
    subject_code = request.args.get("subject_code")

    result = attendance_service.get_bunk_o_meter(student_id, subject_code)
    return jsonify(result), 200


@attendance_bp.route("/bunk-calculator", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def bunk_calculator():
    """
    Calculate dynamic bunk limits globally and per-course.
    """
    student_id = resolve_student_identity(get_jwt_identity())
    summary = attendance_service.get_bunk_o_meter(student_id)
    subjects = summary.get("subjects", [])

    total_global = 0
    present_global = 0

    subjects_calc = []
    for s in subjects:
        present = s.get("present", 0) + s.get("late", 0) + s.get("on_duty", 0)
        total = s.get("total_classes", 0)
        pct = s.get("percentage", 0.0)

        total_global += total
        present_global += present

        if pct >= 75.0:
            bunk_limit = int(present / 0.75) - total
            consecutive = 0
        else:
            bunk_limit = 0
            consecutive = 3 * total - 4 * present

        subjects_calc.append({
            "subject_code": s.get("subject_code"),
            "subject_name": s.get("subject_name"),
            "present": present,
            "total": total,
            "percentage": pct,
            "safe": pct >= 75.0,
            "bunk_limit": max(0, bunk_limit),
            "consecutive_needed": max(0, consecutive)
        })

    global_pct = (present_global / total_global * 100) if total_global > 0 else 0.0
    if global_pct >= 75.0:
        global_bunk_limit = int(present_global / 0.75) - total_global
        global_consecutive = 0
    else:
        global_bunk_limit = 0
        global_consecutive = 3 * total_global - 4 * present_global

    return jsonify({
        "global": {
            "present": present_global,
            "total": total_global,
            "percentage": round(global_pct, 2),
            "safe": global_pct >= 75.0,
            "bunk_limit": max(0, global_bunk_limit),
            "consecutive_needed": max(0, global_consecutive)
        },
        "subjects": subjects_calc
    }), 200


# ── Faculty Sessions ──────────────────────────────────────────────

@attendance_bp.route("/my-sessions", methods=["GET"])
@jwt_required()
@role_required("faculty", "admin")
def my_sessions():
    """
    Get all attendance sessions for the logged-in faculty.
    Query params: ?date=2026-05-09 (optional)
    """
    faculty_id = get_jwt_identity()
    session_date = request.args.get("date")

    if session_date:
        session_date = date.fromisoformat(session_date)

    sessions = attendance_service.get_faculty_sessions(faculty_id, session_date)
    return jsonify({"sessions": sessions}), 200


# ── Reactivate Active Session (Faculty Only) ───────────────────────

@attendance_bp.route("/session/active/reactivate", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def reactivate_active_session():
    """
    Reactivate the latest session for the logged-in faculty.
    Clears all marked attendance records for this session.
    """
    faculty_id = get_jwt_identity()
    from ..models.attendance import Attendance, AttendanceRecord
    from ..extensions import db

    # Find the latest session created by this faculty
    session = Attendance.query.filter_by(faculty_id=faculty_id).order_by(Attendance.created_at.desc()).first()
    if not session:
        return jsonify({"error": "No active session found to reactivate"}), 404

    try:
        # Do not delete attendance records; preserve them so scanned students remain present
        # Generate new QR token (with defaults for fallback)
        result, error = attendance_service.generate_qr_token(session.id, faculty_id, 13.1818, 80.0401)
        if error:
            return jsonify({"error": error}), 400
            
        return jsonify({
            "message": "Session reactivated (attendance records preserved)",
            "session": session.to_dict(),
            "qr_token": result.get("qr_token"),
            "expires_at": result.get("expires_at"),
            "validity_seconds": result.get("validity_seconds")
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to reactivate session: {str(e)}"}), 500


# ── Get Students for Attendance ────────────────────────────────────

@attendance_bp.route("/students", methods=["GET"])
@jwt_required()
@role_required("faculty", "admin")
def get_class_students():
    """
    Get all students in a class for attendance marking.
    Query params: ?department=CSE&semester=3&section=A
    """
    from ..repositories.user_repo import UserRepository
    user_repo = UserRepository()

    department = request.args.get("department")
    semester = request.args.get("semester", type=int)
    section = request.args.get("section")

    if not all([department, semester, section]):
        return jsonify({"error": "department, semester, section required"}), 400

    students = user_repo.get_students_by_class(department, semester, section)
    return jsonify({
        "students": [s.to_dict() for s in students],
        "total": len(students),
    }), 200


# ── Get Attendance Trends (Student Only) ──────────────────────────

@attendance_bp.route("/trends", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def get_trends():
    """Get overall and subject-wise cumulative attendance trends."""
    student_id = resolve_student_identity(get_jwt_identity())
    result = attendance_service.get_attendance_trends(student_id)
    return jsonify(result), 200


# ── Get Student Attendance Records (Student Only) ──────────────────

@attendance_bp.route("/my-records", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def get_my_records():
    """Get all attendance records for the logged-in student."""
    student_id = resolve_student_identity(get_jwt_identity())
    subject_code = request.args.get("subject_code")
    result = attendance_service.get_student_records(student_id, subject_code)
    return jsonify({"records": result}), 200


# ── Report Discrepancy (Student Only) ──────────────────────────────

@attendance_bp.route("/discrepancy", methods=["POST"])
@jwt_required()
@role_required("student")
def report_discrepancy():
    """
    Student reports a discrepancy for an attendance record.
    Body: {"record_id": "...", "reason": "..."}
    """
    data = request.get_json() or {}
    student_id = get_jwt_identity()
    record_id = data.get("record_id")
    reason = data.get("reason", "").strip()

    if not record_id or not reason:
        return jsonify({"error": "record_id and non-empty reason are required"}), 400

    result, error = attendance_service.report_discrepancy(student_id, record_id, reason)
    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Discrepancy reported successfully", "discrepancy": result}), 201


# ── List Discrepancies (Student, Faculty, Admin) ───────────────────

@attendance_bp.route("/discrepancies", methods=["GET"])
@jwt_required()
def get_discrepancies():
    """
    List discrepancies for the logged-in user.
    Query params: ?status=pending
    """
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role", "student")
    status = request.args.get("status")

    result = attendance_service.get_discrepancies(user_id, role, status)
    return jsonify({"discrepancies": result}), 200


# ── Resolve Discrepancy (Faculty, Admin) ───────────────────────────

@attendance_bp.route("/discrepancy/<discrepancy_id>/resolve", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def resolve_discrepancy(discrepancy_id):
    """
    Resolve or reject a student discrepancy.
    Body: {
        "status": "resolved" or "rejected",
        "resolution_remarks": "...",
        "updated_status": "present" or "absent" or "late"  (optional, if resolved)
    }
    """
    data = request.get_json() or {}
    faculty_id = get_jwt_identity()
    status = data.get("status")
    remarks = data.get("resolution_remarks")
    updated_status = data.get("updated_status")

    if not status or status not in ["resolved", "rejected"]:
        return jsonify({"error": "status must be 'resolved' or 'rejected'"}), 400
    if not remarks:
        remarks = "Resolved by faculty" if status == "resolved" else "Rejected by faculty"

    result, error = attendance_service.resolve_discrepancy(
        discrepancy_id, faculty_id, status, remarks, updated_status
    )
    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Discrepancy status updated", "discrepancy": result}), 200


# ── Trigger Attendance Alerts (Admin Only) ─────────────────────────

@attendance_bp.route("/alerts/run", methods=["POST"])
@jwt_required()
@role_required("admin")
def run_alerts():
    """Trigger the cron job task manually to alert students with low attendance."""
    result = attendance_service.run_attendance_alerts()
    return jsonify(result), 200
