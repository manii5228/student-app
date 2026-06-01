"""
Academic API — Assignments, Results, Syllabus, Exams, Credits, Internal Marks,
               Faculty Directory, Bunk Simulator, Question Papers
"""

import os
import hmac
import hashlib
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.credit_service import CreditService

from ..extensions import db
from ..middleware.auth_middleware import role_required, resolve_student_identity
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
    if assignment and datetime.now(timezone.utc) > assignment.due_date.replace(tzinfo=timezone.utc):
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


@academic_bp.route("/assignments/<aid>/upload", methods=["POST"])
@jwt_required()
@role_required("student")
def upload_assignment_file(aid):
    """
    Upload file for an assignment submission (simulating cloud storage).
    Run virus scan and plagiarism check.
    """
    student_id = get_jwt_identity()
    assignment = db.session.get(Assignment, aid)
    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404
        
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    uploads_dir = os.path.join(os.getcwd(), 'instance', 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    
    filename = f"{student_id}_{file.filename}"
    file_path = os.path.join(uploads_dir, filename)
    file.save(file_path)
    
    with open(file_path, "rb") as f:
        file_bytes = f.read()
        
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    
    # 1. Virus Scan (mock scan: check if filename contains "virus" or "malware")
    virus_scan_passed = True
    if b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE" in file_bytes or "virus" in file.filename.lower() or "malware" in file.filename.lower():
        virus_scan_passed = False
        
    # 2. Plagiarism Check (random plagiarism score 0 to 15%)
    plagiarism_score = float(int(file_hash[:2], 16) % 15)
    
    sub = AssignmentSubmission.query.filter_by(assignment_id=aid, student_id=student_id).first()
    
    status = AssignmentStatus.SUBMITTED
    if assignment.due_date and datetime.now(timezone.utc) > assignment.due_date.replace(tzinfo=timezone.utc):
        status = AssignmentStatus.LATE if assignment.allow_late else AssignmentStatus.LATE

    if sub:
        sub.file_name = file.filename
        sub.file_url = f"/api/v1/academic/submissions/download/{filename}"
        sub.submission_hash = file_hash
        sub.status = status
        sub.plagiarism_score = plagiarism_score
        sub.virus_scan_passed = virus_scan_passed
        sub.submitted_at = datetime.now(timezone.utc)
    else:
        sub = AssignmentSubmission(
            assignment_id=aid,
            student_id=student_id,
            file_name=file.filename,
            file_url=f"/api/v1/academic/submissions/download/{filename}",
            submission_hash=file_hash,
            status=status,
            plagiarism_score=plagiarism_score,
            virus_scan_passed=virus_scan_passed,
        )
        db.session.add(sub)
        
    db.session.commit()
    
    return jsonify({
        "message": "File uploaded and processed successfully",
        "submission": sub.to_dict()
    }), 201


@academic_bp.route("/submissions/download/<filename>", methods=["GET"])
@jwt_required()
def download_submission(filename):
    """Download a submitted assignment file."""
    user = db.session.get(User, get_jwt_identity())
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    if user.role == UserRole.STUDENT:
        if not filename.startswith(user.id):
            return jsonify({"error": "Access Denied"}), 403
            
    uploads_dir = os.path.join(os.getcwd(), 'instance', 'uploads')
    file_path = os.path.join(uploads_dir, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
        
    return send_file(file_path)


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
@role_required("student", "guest")
def my_results():
    """Get semester-wise results with SGPA/CGPA."""
    sid = resolve_student_identity(get_jwt_identity())
    semester = request.args.get("semester", type=int)
    query = Result.query.filter_by(student_id=sid, published=True)
    if semester:
        query = query.filter_by(semester=semester)
    results = query.order_by(Result.semester, Result.subject_code).all()
    return jsonify({"results": [r.to_dict() for r in results]}), 200


@academic_bp.route("/results/analytics", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def results_analytics():
    """
    Get statistical insights and percentile ranking for examination results.
    Also returns cryptographic signature verification.
    """
    sid = resolve_student_identity(get_jwt_identity())
    semester = request.args.get("semester", type=int)
    
    if not semester:
        return jsonify({"error": "Semester is required"}), 400
        
    student = db.session.get(User, sid)
    if not student:
        return jsonify({"error": "Student not found"}), 404
        
    results = Result.query.filter_by(student_id=sid, semester=semester, published=True).all()
    if not results:
        return jsonify({
            "results": [],
            "class_averages": {},
            "percentiles": {},
            "overall_percentile": 100.0,
            "overall_average": 0.0,
            "signature_receipt": None
        }), 200
        
    class_averages = {}
    percentiles = {}
    secret_key = b"vtu-secure-gradebook-signature-secret-key"
    signature_payload = []
    
    for r in results:
        subject_code = r.subject_code
        student_score = r.total_marks if r.total_marks is not None else 0.0
        
        # Calculate class average for this subject
        avg_score = db.session.query(db.func.avg(Result.total_marks)).filter_by(
            subject_code=subject_code,
            semester=semester,
            published=True
        ).scalar()
        
        # Calculate student's percentile in this subject
        all_marks = db.session.query(Result.student_id, Result.total_marks).filter_by(
            subject_code=subject_code,
            semester=semester,
            published=True
        ).all()
        
        scores = [m[1] for m in all_marks if m[1] is not None]
        scores.sort()
        
        if scores:
            equal_or_less = sum(1 for s in scores if s <= student_score)
            pct = (equal_or_less / len(scores)) * 100.0
        else:
            pct = 100.0
            
        class_averages[subject_code] = round(avg_score, 2) if avg_score is not None else 0.0
        percentiles[subject_code] = round(pct, 1)
        
        # Add signature to result if not present
        if not r.digital_signature:
            raw_sig_data = f"{sid}:{semester}:{subject_code}:{student_score}"
            r.digital_signature = hmac.new(secret_key, raw_sig_data.encode(), hashlib.sha256).hexdigest()
            r.hash_receipt = hashlib.sha256(raw_sig_data.encode()).hexdigest()
            
        signature_payload.append(f"{subject_code}:{student_score}:{r.digital_signature}")
        
    db.session.commit()
    
    # Calculate overall stats
    student_total = sum(r.total_marks for r in results if r.total_marks is not None)
    all_student_totals = {}
    
    all_results = Result.query.filter_by(semester=semester, published=True).all()
    for ar in all_results:
        if ar.total_marks is not None:
            all_student_totals[ar.student_id] = all_student_totals.get(ar.student_id, 0.0) + ar.total_marks
            
    totals_list = list(all_student_totals.values())
    totals_list.sort()
    
    if totals_list:
        equal_or_less_total = sum(1 for t in totals_list if t <= student_total)
        overall_pct = (equal_or_less_total / len(totals_list)) * 100.0
        overall_avg = sum(totals_list) / len(totals_list)
    else:
        overall_pct = 100.0
        overall_avg = 0.0
        
    combined_payload = "|".join(signature_payload)
    overall_signature = hmac.new(secret_key, combined_payload.encode(), hashlib.sha256).hexdigest()
    
    return jsonify({
        "results": [r.to_dict() for r in results],
        "class_averages": class_averages,
        "percentiles": percentiles,
        "overall_percentile": round(overall_pct, 1),
        "overall_average": round(overall_avg, 2),
        "signature_receipt": overall_signature
    }), 200


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
    academic_year = request.args.get("academic_year")
    version = request.args.get("version", type=int)
    
    query = Syllabus.query
    if code:
        query = query.filter_by(subject_code=code)
    if dept:
        query = query.filter_by(department=dept)
    if sem:
        query = query.filter_by(semester=sem)
    if academic_year:
        query = query.filter_by(academic_year=academic_year)
    if version:
        query = query.filter_by(version=version)
        
    units = query.order_by(Syllabus.subject_code, Syllabus.unit_number).all()
    return jsonify({"syllabus": [u.to_dict() for u in units]}), 200


@academic_bp.route("/syllabus/progress", methods=["POST"])
@jwt_required()
@role_required("faculty")
def update_syllabus_progress():
    """Faculty marks a syllabus unit or a specific topic as completed."""
    data = request.get_json()
    unit = db.session.get(Syllabus, data["unit_id"])
    if not unit:
        return jsonify({"error": "Unit not found"}), 404

    topic_name = data.get("topic_name")
    is_completed = data.get("is_completed", True)

    import json
    if topic_name:
        try:
            completed_list = json.loads(unit.completed_topics) if unit.completed_topics else []
            if not isinstance(completed_list, list):
                completed_list = []
        except Exception:
            completed_list = [t.strip() for t in (unit.completed_topics or "").split(",") if t.strip()]

        topic_name_clean = topic_name.strip()
        if is_completed:
            if topic_name_clean not in completed_list:
                completed_list.append(topic_name_clean)
        else:
            if topic_name_clean in completed_list:
                completed_list.remove(topic_name_clean)

        unit.completed_topics = json.dumps(completed_list)

        # Check if all topics in the unit are completed
        all_topics = [t.strip() for t in (unit.topics or "").split(",") if t.strip()]
        if all_topics and all(t in completed_list for t in all_topics):
            unit.is_completed = True
        else:
            unit.is_completed = False
    else:
        unit.is_completed = is_completed
        if is_completed:
            all_topics = [t.strip() for t in (unit.topics or "").split(",") if t.strip()]
            unit.completed_topics = json.dumps(all_topics)
        else:
            unit.completed_topics = "[]"

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


@academic_bp.route("/exams", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def create_exam():
    """Create a new exam slot with schedule overlap validation."""
    data = request.get_json()
    exam_date = datetime.strptime(data["exam_date"], "%Y-%m-%d").date()
    start_time = datetime.strptime(data["start_time"], "%H:%M").time()
    end_time = datetime.strptime(data["end_time"], "%H:%M").time()
    dept = data["department"]
    sem = int(data["semester"])
    
    # Check conflicts for the same cohort (department, semester, date)
    conflicts = ExamSchedule.query.filter_by(
        department=dept,
        semester=sem,
        exam_date=exam_date
    ).all()
    
    for c in conflicts:
        if (start_time < c.end_time) and (end_time > c.start_time):
            return jsonify({
                "error": f"Exam conflict detected! {c.subject_name} is already scheduled at this time."
            }), 409
            
    exam = ExamSchedule(
        subject_code=data["subject_code"],
        subject_name=data["subject_name"],
        department=dept,
        semester=sem,
        exam_date=exam_date,
        start_time=start_time,
        end_time=end_time,
        room_number=data.get("room_number", "LH-101"),
        building=data.get("building", "Main Block"),
        exam_type=data.get("exam_type", "end_semester")
    )
    db.session.add(exam)
    db.session.commit()
    return jsonify({"message": "Exam scheduled successfully", "exam": exam.to_dict()}), 201


# ── Credit Dashboard ──────────────────────────────────────────────

@academic_bp.route("/credits", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def credit_dashboard():
    """Get credit progress for current student."""
    student_id = resolve_student_identity(get_jwt_identity())
    credit_service = CreditService()
    try:
        credits_data = credit_service.calculate_credit_progress(student_id)
        return jsonify({"credits": credits_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@academic_bp.route("/credits/roadmap", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def credit_roadmap():
    """Get prerequisite roadmap for current student."""
    student_id = resolve_student_identity(get_jwt_identity())
    credit_service = CreditService()
    try:
        roadmap_data = credit_service.get_degree_roadmap(student_id)
        return jsonify(roadmap_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@academic_bp.route("/credits/audit/pdf", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def download_degree_audit():
    """Generate and download official degree audit PDF."""
    student_id = resolve_student_identity(get_jwt_identity())
    credit_service = CreditService()
    try:
        pdf_buffer = credit_service.generate_degree_audit_pdf(student_id)
        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"Degree_Audit_{student_id[:8]}.pdf"
        )
    except Exception as e:
        return jsonify({"error": f"Failed to generate Degree Audit PDF: {str(e)}"}), 500


# ── Internal Marks ─────────────────────────────────────────────────

@academic_bp.route("/internal-marks", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def my_internal_marks():
    """Get internal marks (CAT1, CAT2, Model, Lab)."""
    sid = resolve_student_identity(get_jwt_identity())
    sem = request.args.get("semester", type=int)
    query = InternalMark.query.filter_by(student_id=sid)
    if sem:
        query = query.filter_by(semester=sem)
    marks = query.order_by(InternalMark.subject_code).all()
    return jsonify({"marks": [m.to_dict() for m in marks]}), 200


@academic_bp.route("/internal-marks/analytics", methods=["GET"])
@jwt_required()
@role_required("student", "guest")
def internal_marks_analytics():
    """
    Calculate average internal marks per subject to identify struggling subjects.
    A subject is flagged as struggling if the class-wide average is below 60%.
    """
    sid = resolve_student_identity(get_jwt_identity())
    student = db.session.get(User, sid)
    if not student:
        return jsonify({"error": "Student not found"}), 404
        
    my_marks = InternalMark.query.filter_by(student_id=sid, semester=student.semester).all()
    
    # Query all students in this cohort
    cohort_students = User.query.filter_by(
        department=student.department,
        semester=student.semester
    ).all()
    cohort_student_ids = [s.id for s in cohort_students]
    
    all_cohort_marks = InternalMark.query.filter(
        InternalMark.student_id.in_(cohort_student_ids),
        InternalMark.semester == student.semester
    ).all()
    
    subject_marks = {}
    for m in all_cohort_marks:
        if m.max_marks and m.marks_obtained is not None:
            pct = (m.marks_obtained / m.max_marks) * 100.0
            subject_marks.setdefault(m.subject_code, []).append(pct)
            
    struggling_subjects = []
    class_stats = {}
    
    for code, percentages in subject_marks.items():
        avg_pct = sum(percentages) / len(percentages)
        subject_name = next((m.subject_name for m in all_cohort_marks if m.subject_code == code), "")
        
        class_stats[code] = {
            "subject_name": subject_name,
            "class_average_percentage": round(avg_pct, 1),
            "is_struggling": avg_pct < 60.0
        }
        if avg_pct < 60.0:
            struggling_subjects.append({
                "subject_code": code,
                "subject_name": subject_name,
                "class_average_percentage": round(avg_pct, 1)
            })
            
    return jsonify({
        "my_marks": [m.to_dict() for m in my_marks],
        "class_stats": class_stats,
        "struggling_subjects": struggling_subjects
    }), 200


@academic_bp.route("/internal-marks/class", methods=["GET"])
@jwt_required()
@role_required("faculty", "admin")
def get_class_marks():
    """Retrieve existing marks for a class/subject/test type."""
    subject_code = request.args.get("subject_code")
    test_type = request.args.get("test_type")
    
    if not subject_code or not test_type:
        return jsonify({"error": "subject_code and test_type are required"}), 400
        
    fid = get_jwt_identity()
    user = db.session.get(User, fid)
    
    # Query students in the faculty's class
    students_query = User.query.filter_by(role=UserRole.STUDENT, is_active=True)
    if user.role.value == "faculty":
        students_query = students_query.filter_by(
            department=user.department,
            semester=user.semester,
            section=user.section
        )
    students = students_query.order_by(User.first_name).all()
    student_ids = [s.id for s in students]
    
    # Fetch existing marks for these students
    marks = InternalMark.query.filter(
        InternalMark.student_id.in_(student_ids),
        InternalMark.subject_code == subject_code,
        InternalMark.test_type == test_type
    ).all()
    
    marks_dict = {m.student_id: m.marks_obtained for m in marks}
    
    return jsonify({
        "students": [
            {
                "id": s.id,
                "name": s.full_name,
                "roll_number": s.roll_number,
                "marks": marks_dict.get(s.id, None)
            } for s in students
        ]
    }), 200


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
    """Searchable list of professors with real-time teaching availability status."""
    dept = request.args.get("department")
    search = request.args.get("q")
    query = User.query.filter_by(role=UserRole.FACULTY, is_active=True)
    if dept:
        query = query.filter_by(department=dept)
    if search:
        s = f"%{search}%"
        query = query.filter(User.first_name.ilike(s) | User.last_name.ilike(s) | User.specialization.ilike(s))
    faculty = query.order_by(User.first_name).all()
    
    # Check availability
    now = datetime.now()
    weekday_map = {
        0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"
    }
    current_day_str = weekday_map[now.weekday()]
    current_time = now.time()
    
    from ..models.timetable import TimetableSlot
    faculty_list = []
    for f in faculty:
        active_slots = db.session.query(TimetableSlot).filter(
            TimetableSlot.faculty_id == f.id,
            TimetableSlot.is_cancelled == False
        ).all()
        
        status = "Available"
        current_class = None
        for slot in active_slots:
            if slot.day.name.lower() == current_day_str.lower() or slot.day.value.lower() == current_day_str.lower():
                if slot.start_time <= current_time <= slot.end_time:
                    status = "In Class"
                    current_class = f"{slot.subject_code} - {slot.subject_name} ({slot.room_number})"
                    break
                    
        f_dict = f.to_dict()
        f_dict["availability_status"] = status
        f_dict["current_class"] = current_class
        f_dict["publications"] = f.publications
        f_dict["research_interests"] = f.research_interests
        f_dict["office_hours"] = f.office_hours
        f_dict["office_location"] = f.office_location
        faculty_list.append(f_dict)
        
    return jsonify({"faculty": faculty_list}), 200


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
    """Upload a previous year question paper with simple indexing."""
    data = request.get_json()
    
    qp = QuestionPaper(
        subject_code=data["subject_code"],
        subject_name=data["subject_name"],
        department=data["department"],
        semester=data["semester"],
        year=data["year"],
        exam_type=data.get("exam_type", "end_semester"),
        file_url=data["file_url"],
        file_size_kb=data.get("file_size_kb", 1500),
        uploaded_by=get_jwt_identity(),
        ocr_content=None
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


@academic_bp.route("/meetings/booked", methods=["GET"])
@jwt_required()
def get_student_booked_meetings():
    """Get the list of meetings booked by the current student."""
    from ..models.career import MeetingSlot
    from ..models.user import User
    
    student_id = get_jwt_identity()
    booked = MeetingSlot.query.filter_by(booked_by=student_id, is_booked=True).order_by(MeetingSlot.date.desc(), MeetingSlot.start_time.desc()).all()
    
    result = []
    for slot in booked:
        faculty = db.session.get(User, slot.faculty_id)
        result.append({
            "id": slot.id,
            "faculty_id": slot.faculty_id,
            "faculty_name": faculty.full_name if faculty else "Unknown Faculty",
            "faculty_email": faculty.email if faculty else "",
            "date": str(slot.date),
            "start_time": slot.start_time.strftime("%H:%M") if slot.start_time else None,
            "end_time": slot.end_time.strftime("%H:%M") if slot.end_time else None,
            "purpose": slot.purpose,
            "meet_link": "https://meet.google.com/abc-defg-hij"
        })
        
    return jsonify({"meetings": result}), 200

