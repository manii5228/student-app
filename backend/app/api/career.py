"""
Career API — Job Portal, Eligibility Check, Interviews, Company Prep, Alumni, Referrals
"""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..middleware.auth_middleware import role_required
from ..models.career import (
    JobPosting, JobApplication, InterviewSchedule,
    CompanyPrepQuestion, AlumniProfile,
)
from ..models.user import User

career_bp = Blueprint("career", __name__)


# ── Job Portal ─────────────────────────────────────────────────────

@career_bp.route("/jobs", methods=["GET"])
@jwt_required()
def list_jobs():
    """Feed of companies visiting for placements."""
    jtype = request.args.get("type")
    query = JobPosting.query.filter_by(is_active=True)
    if jtype:
        query = query.filter_by(job_type=jtype)
    jobs = query.order_by(JobPosting.created_at.desc()).all()
    return jsonify({"jobs": [j.to_dict() for j in jobs]}), 200


@career_bp.route("/jobs", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_job():
    """Admin posts a placement/internship opportunity."""
    data = request.get_json()
    j = JobPosting(
        company_name=data["company_name"], role_title=data["role_title"],
        description=data.get("description"), package_lpa=data.get("package_lpa"),
        min_cgpa=data.get("min_cgpa", 0), job_type=data.get("job_type", "placement"),
        eligible_departments=data.get("eligible_departments", "all"),
        eligible_batch_year=data.get("eligible_batch_year"),
    )
    if data.get("drive_date"):
        from datetime import date as dt_date
        j.drive_date = dt_date.fromisoformat(data["drive_date"])
    if data.get("last_date_apply"):
        from datetime import date as dt_date
        j.last_date_apply = dt_date.fromisoformat(data["last_date_apply"])
    db.session.add(j)
    db.session.commit()
    return jsonify({"message": "Job posted", "job": j.to_dict()}), 201


# ── Eligibility Check ─────────────────────────────────────────────

@career_bp.route("/jobs/<jid>/check-eligibility", methods=["GET"])
@jwt_required()
@role_required("student")
def check_eligibility(jid):
    """Auto Yes/No based on CGPA."""
    job = db.session.get(JobPosting, jid)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    user = db.session.get(User, get_jwt_identity())
    eligible = (user.cgpa or 0) >= (job.min_cgpa or 0)
    dept_ok = job.eligible_departments == "all" or (user.department or "") in job.eligible_departments
    return jsonify({
        "eligible": eligible and dept_ok,
        "your_cgpa": user.cgpa, "required_cgpa": job.min_cgpa,
        "department_match": dept_ok,
    }), 200


# ── Apply ──────────────────────────────────────────────────────────

@career_bp.route("/jobs/<jid>/apply", methods=["POST"])
@jwt_required()
@role_required("student")
def apply_job(jid):
    """Apply for a placement."""
    data = request.get_json() or {}
    app = JobApplication(
        posting_id=jid, student_id=get_jwt_identity(),
        resume_url=data.get("resume_url"),
    )
    db.session.add(app)
    db.session.commit()
    return jsonify({"message": "Applied"}), 201


@career_bp.route("/jobs/my-applications", methods=["GET"])
@jwt_required()
@role_required("student")
def my_applications():
    """Get student's job applications."""
    apps = JobApplication.query.filter_by(student_id=get_jwt_identity())\
        .order_by(JobApplication.applied_at.desc()).all()
    return jsonify({"applications": [a.to_dict() for a in apps]}), 200


# ── Interview Scheduler ───────────────────────────────────────────

@career_bp.route("/interviews", methods=["GET"])
@jwt_required()
@role_required("student")
def my_interviews():
    """Get upcoming interview schedule."""
    schedules = InterviewSchedule.query.filter_by(student_id=get_jwt_identity())\
        .order_by(InterviewSchedule.scheduled_at).all()
    return jsonify({"interviews": [s.to_dict() for s in schedules]}), 200


# ── Company Prep ───────────────────────────────────────────────────

@career_bp.route("/prep/<company>", methods=["GET"])
@jwt_required()
def company_prep(company):
    """Get previous years' interview questions."""
    questions = CompanyPrepQuestion.query.filter(
        CompanyPrepQuestion.company_name.ilike(f"%{company}%")
    ).order_by(CompanyPrepQuestion.year.desc()).all()
    return jsonify({"questions": [q.to_dict() for q in questions]}), 200


# ── Alumni / Referral Hub ─────────────────────────────────────────

@career_bp.route("/alumni", methods=["GET"])
@jwt_required()
def alumni_directory():
    """Search alumni for referrals."""
    dept = request.args.get("department")
    company = request.args.get("company")
    query = AlumniProfile.query
    if dept:
        query = query.filter_by(department=dept)
    if company:
        query = query.filter(AlumniProfile.company.ilike(f"%{company}%"))
    alumni = query.order_by(AlumniProfile.batch_year.desc()).limit(50).all()
    return jsonify({"alumni": [a.to_dict() for a in alumni]}), 200


@career_bp.route("/alumni/referral-hub", methods=["GET"])
@jwt_required()
def referral_hub():
    """Alumni open to referrals."""
    alumni = AlumniProfile.query.filter_by(is_open_to_referral=True)\
        .order_by(AlumniProfile.company).all()
    return jsonify({"referral_alumni": [a.to_dict() for a in alumni]}), 200
