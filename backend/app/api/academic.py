"""
Academic API — Assignments, Results, Syllabus, Exams, Credits, Internal Marks,
               Faculty Directory, Bunk Simulator, Question Papers
"""

import hashlib
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..middleware.auth_middleware import role_required
from ..models.academic import (
    Assignment, AssignmentSubmission, Result, Syllabus,
    ExamSchedule, CreditProgress, InternalMark, AssignmentStatus,
    QuestionPaper,
)
from ..models.user import User, UserRole

academic_bp = Blueprint("academic", __name__)


# ── Assignments ────────────────────────────────────────────────────

@academic_bp.route("/assignments", methods=["GET"])
@jwt_required()
def list_assignments():
    """List assignments for current user's class."""
    user = db.session.get(User, get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404
    query = Assignment.query
    if user.role == UserRole.STUDENT:
        query = query.filter_by(department=user.department, semester=user.semester, section=user.section)
    elif user.role == UserRole.FACULTY:
        query = query.filter_by(faculty_id=user.id)
    assignments = query.order_by(Assignment.due_date.desc()).all()
    return jsonify({"assignments": [a.to_dict() for a in assignments]}), 200


@academic_bp.route("/assignments", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def create_assignment():
    """Faculty creates an assignment."""
    data = request.get_json()
    a = Assignment(
        title=data["title"], description=data.get("description"),
        subject_code=data["subject_code"], subject_name=data["subject_name"],
        faculty_id=get_jwt_identity(), department=data["department"],
        semester=data["semester"], section=data["section"],
        max_marks=data.get("max_marks", 100),
        due_date=datetime.fromisoformat(data["due_date"]),
        allow_late=data.get("allow_late", False),
    )
    db.session.add(a)
    db.session.commit()
    return jsonify({"message": "Assignment created", "assignment": a.to_dict()}), 201


@academic_bp.route("/assignments/<aid>/submit", methods=["POST"])
@jwt_required()
@role_required("student")
def submit_assignment(aid):
    """
    Student submits an assignment.
    File is expected to already be uploaded to S3; this endpoint
    stores the metadata and generates a unique Submission Hash (receipt).
    """
    data = request.get_json()
    student_id = get_jwt_identity()

    # Generate unique SHA-256 submission hash
    raw = f"{aid}:{student_id}:{datetime.now(timezone.utc).isoformat()}"
    submission_hash = hashlib.sha256(raw.encode()).hexdigest()

    # Detect late submission
    assignment = db.session.get(Assignment, aid)
    status = AssignmentStatus.SUBMITTED
    if assignment and datetime.now(timezone.utc) > assignment.due_date:
        status = AssignmentStatus.LATE if assignment.allow_late else AssignmentStatus.LATE

    sub = AssignmentSubmission(
        assignment_id=aid, student_id=student_id,
        file_url=data.get("file_url"), file_name=data.get("file_name"),
        submission_hash=submission_hash,
        status=status,
    )
    db.session.add(sub)
    db.session.commit()
    return jsonify({
        "message": "Submitted",
        "submission_hash": submission_hash,
        "submission": sub.to_dict(),
    }), 201


@academic_bp.route("/assignments/<aid>/grade", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def grade_assignment(aid):
    """Faculty grades a submission."""
    data = request.get_json()
    sub = AssignmentSubmission.query.filter_by(
        assignment_id=aid, student_id=data["student_id"]).first()
    if not sub:
        return jsonify({"error": "Submission not found"}), 404
    sub.marks_obtained = data["marks"]
    sub.faculty_comment = data.get("comment")
    sub.status = AssignmentStatus.GRADED
    sub.graded_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"message": "Graded", "submission": sub.to_dict()}), 200


# ── Results / Gradebook ───────────────────────────────────────────

@academic_bp.route("/results", methods=["GET"])
@jwt_required()
@role_required("student")
def my_results():
    """Get semester-wise results with SGPA/CGPA."""
    sid = get_jwt_identity()
    semester = request.args.get("semester", type=int)
    query = Result.query.filter_by(student_id=sid, published=True)
    if semester:
        query = query.filter_by(semester=semester)
    results = query.order_by(Result.semester, Result.subject_code).all()
    return jsonify({"results": [r.to_dict() for r in results]}), 200


@academic_bp.route("/results/bulk", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def upload_results():
    """Bulk upload results (spreadsheet-style)."""
    data = request.get_json()
    records = data.get("records", [])
    created = 0
    for rec in records:
        r = Result(
            student_id=rec["student_id"], semester=rec["semester"],
            subject_code=rec["subject_code"], subject_name=rec["subject_name"],
            credits=rec.get("credits", 3),
            internal_marks=rec.get("internal_marks"),
            external_marks=rec.get("external_marks"),
            total_marks=rec.get("total_marks"), grade=rec.get("grade"),
            grade_points=rec.get("grade_points"),
        )
        db.session.add(r)
        created += 1
    db.session.commit()
    return jsonify({"message": f"{created} results uploaded"}), 201


# ── Syllabus ───────────────────────────────────────────────────────

@academic_bp.route("/syllabus", methods=["GET"])
@jwt_required()
def get_syllabus():
    """Get syllabus units (offline-ready)."""
    code = request.args.get("subject_code")
    dept = request.args.get("department")
    sem = request.args.get("semester", type=int)
    query = Syllabus.query
    if code:
        query = query.filter_by(subject_code=code)
    if dept:
        query = query.filter_by(department=dept)
    if sem:
        query = query.filter_by(semester=sem)
    units = query.order_by(Syllabus.subject_code, Syllabus.unit_number).all()
    return jsonify({"syllabus": [u.to_dict() for u in units]}), 200


@academic_bp.route("/syllabus/progress", methods=["POST"])
@jwt_required()
@role_required("faculty")
def update_syllabus_progress():
    """Faculty marks a syllabus unit as completed."""
    data = request.get_json()
    unit = db.session.get(Syllabus, data["unit_id"])
    if not unit:
        return jsonify({"error": "Unit not found"}), 404
    unit.is_completed = data.get("is_completed", True)
    unit.completed_by = get_jwt_identity()
    db.session.commit()
    return jsonify({"message": "Progress updated", "unit": unit.to_dict()}), 200


# ── Exam Schedule ──────────────────────────────────────────────────

@academic_bp.route("/exams", methods=["GET"])
@jwt_required()
def exam_schedule():
    """Get personalized exam schedule."""
    user = db.session.get(User, get_jwt_identity())
    query = ExamSchedule.query
    if user and user.department:
        query = query.filter_by(department=user.department)
    if user and user.semester:
        query = query.filter_by(semester=user.semester)
    exams = query.order_by(ExamSchedule.exam_date).all()
    return jsonify({"exams": [e.to_dict() for e in exams]}), 200


# ── Credit Dashboard ──────────────────────────────────────────────

@academic_bp.route("/credits", methods=["GET"])
@jwt_required()
@role_required("student")
def credit_dashboard():
    """Get credit progress for current student."""
    cp = CreditProgress.query.filter_by(student_id=get_jwt_identity()).first()
    if not cp:
        return jsonify({"credits": {"total_required": 160, "total_earned": 0, "percentage": 0}}), 200
    return jsonify({"credits": cp.to_dict()}), 200


# ── Internal Marks ─────────────────────────────────────────────────

@academic_bp.route("/internal-marks", methods=["GET"])
@jwt_required()
@role_required("student")
def my_internal_marks():
    """Get internal marks (CAT1, CAT2, Model, Lab)."""
    sid = get_jwt_identity()
    sem = request.args.get("semester", type=int)
    query = InternalMark.query.filter_by(student_id=sid)
    if sem:
        query = query.filter_by(semester=sem)
    marks = query.order_by(InternalMark.subject_code).all()
    return jsonify({"marks": [m.to_dict() for m in marks]}), 200


@academic_bp.route("/internal-marks/bulk", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def bulk_internal_marks():
    """Faculty enters marks spreadsheet-style with auto-save."""
    data = request.get_json()
    records = data.get("records", [])
    fid = get_jwt_identity()
    for rec in records:
        existing = InternalMark.query.filter_by(
            student_id=rec["student_id"], subject_code=rec["subject_code"],
            test_type=rec["test_type"], semester=rec["semester"],
        ).first()
        if existing:
            existing.marks_obtained = rec["marks"]
            existing.faculty_id = fid
        else:
            m = InternalMark(
                student_id=rec["student_id"], subject_code=rec["subject_code"],
                subject_name=rec.get("subject_name", ""), semester=rec["semester"],
                test_type=rec["test_type"], max_marks=rec.get("max_marks", 50),
                marks_obtained=rec["marks"], faculty_id=fid,
            )
            db.session.add(m)
    db.session.commit()
    return jsonify({"message": f"{len(records)} marks saved"}), 200


# ── Faculty Directory ──────────────────────────────────────────────

@academic_bp.route("/faculty-directory", methods=["GET"])
@jwt_required()
def faculty_directory():
    """Searchable list of professors."""
    dept = request.args.get("department")
    search = request.args.get("q")
    query = User.query.filter_by(role=UserRole.FACULTY, is_active=True)
    if dept:
        query = query.filter_by(department=dept)
    if search:
        s = f"%{search}%"
        query = query.filter(User.first_name.ilike(s) | User.last_name.ilike(s))
    faculty = query.order_by(User.first_name).all()
    return jsonify({"faculty": [f.to_dict() for f in faculty]}), 200


# ── Bunk-O-Meter Simulator ────────────────────────────────────────

@academic_bp.route("/bunk-simulator", methods=["POST"])
@jwt_required()
@role_required("student")
def bunk_simulator():
    """
    Simulate: 'If I skip X upcoming classes, what will my attendance be?'
    Alerts if skipping the next class drops below 75%.
    
    Body: {"skip_count": 3, "subject_code": "CS301"} (subject_code optional)
    """
    data = request.get_json()
    skip_count = data.get("skip_count", 1)
    subject_code = data.get("subject_code")
    student_id = get_jwt_identity()

    from ..models.attendance import AttendanceRecord, AttendanceSession

    # Build query for this student's attendance
    query = db.session.query(AttendanceRecord).join(AttendanceSession)
    query = query.filter(AttendanceRecord.student_id == student_id)
    if subject_code:
        query = query.filter(AttendanceSession.subject_code == subject_code)

    records = query.all()
    total = len(records)
    present = sum(1 for r in records if r.status.value == "present")

    if total == 0:
        return jsonify({
            "current_percentage": 0,
            "simulated_percentage": 0,
            "skip_count": skip_count,
            "alert": False,
            "message": "No attendance records found.",
        }), 200

    current_pct = round(present / total * 100, 2)

    # Simulate: add skip_count absences to total
    simulated_total = total + skip_count
    simulated_pct = round(present / simulated_total * 100, 2)

    # Calculate max safe bunks to stay >= 75%
    # present / (total + X) >= 0.75  =>  X <= (present / 0.75) - total
    safe_bunks = max(0, int(present / 0.75 - total))

    alert = simulated_pct < 75.0

    return jsonify({
        "current_percentage": current_pct,
        "simulated_percentage": simulated_pct,
        "skip_count": skip_count,
        "safe_bunks_remaining": safe_bunks,
        "total_classes": total,
        "classes_attended": present,
        "alert": alert,
        "message": "WARNING: Skipping will drop you below 75%!" if alert else f"You can safely bunk {safe_bunks} more classes.",
        "subject_code": subject_code,
    }), 200


# ── Previous Year Question Papers ─────────────────────────────────

@academic_bp.route("/question-papers", methods=["GET"])
@jwt_required()
def search_question_papers():
    """
    Search PYQ repository. Indexed by subject_code + year.
    Files cached on CDN for 15k concurrent downloads.
    """
    subject_code = request.args.get("subject_code")
    year = request.args.get("year", type=int)
    dept = request.args.get("department")
    exam_type = request.args.get("exam_type")

    query = QuestionPaper.query
    if subject_code:
        query = query.filter_by(subject_code=subject_code)
    if year:
        query = query.filter_by(year=year)
    if dept:
        query = query.filter_by(department=dept)
    if exam_type:
        query = query.filter_by(exam_type=exam_type)

    papers = query.order_by(QuestionPaper.year.desc(), QuestionPaper.subject_code).all()
    return jsonify({"papers": [p.to_dict() for p in papers]}), 200


@academic_bp.route("/question-papers", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def upload_question_paper():
    """Upload a previous year question paper (file already on S3/CDN)."""
    data = request.get_json()
    qp = QuestionPaper(
        subject_code=data["subject_code"],
        subject_name=data["subject_name"],
        department=data["department"],
        semester=data["semester"],
        year=data["year"],
        exam_type=data.get("exam_type", "end_semester"),
        file_url=data["file_url"],
        file_size_kb=data.get("file_size_kb"),
        uploaded_by=get_jwt_identity(),
    )
    db.session.add(qp)
    db.session.commit()
    return jsonify({"message": "Question paper uploaded", "paper": qp.to_dict()}), 201


@academic_bp.route("/question-papers/<qp_id>/download", methods=["POST"])
@jwt_required()
def track_download(qp_id):
    """Increment download counter and return CDN link."""
    qp = db.session.get(QuestionPaper, qp_id)
    if not qp:
        return jsonify({"error": "Not found"}), 404
    qp.download_count = (qp.download_count or 0) + 1
    db.session.commit()
    return jsonify({"file_url": qp.file_url, "downloads": qp.download_count}), 200

