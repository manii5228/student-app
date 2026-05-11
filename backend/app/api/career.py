"""
Career API — Job Portal, Eligibility Check, Interviews, Company Prep, Alumni, Referrals,
              Project Reminders, Skill Badges
"""

from datetime import datetime, timezone, date as dt_date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..middleware.auth_middleware import role_required
from ..models.career import (
    JobPosting, JobApplication, InterviewSchedule,
    CompanyPrepQuestion, AlumniProfile,
    Project, Milestone, SkillBadge, EarnedBadge,
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


# ── Project Reminders ─────────────────────────────────────────────

@career_bp.route("/projects", methods=["GET"])
@jwt_required()
def my_projects():
    """Get all projects for the logged-in student."""
    projects = Project.query.filter_by(student_id=get_jwt_identity())\
        .order_by(Project.created_at.desc()).all()
    return jsonify({"projects": [p.to_dict() for p in projects]}), 200


@career_bp.route("/projects", methods=["POST"])
@jwt_required()
@role_required("student")
def create_project():
    """Create a new project with milestones."""
    data = request.get_json()
    p = Project(
        student_id=get_jwt_identity(),
        title=data["title"],
        description=data.get("description"),
        subject_code=data.get("subject_code"),
        team_members=data.get("team_members"),
    )
    if data.get("deadline"):
        p.deadline = dt_date.fromisoformat(data["deadline"].replace("Z", "").split("T")[0])

    # Add milestones if provided
    milestones = data.get("milestones", [])
    for m in milestones:
        ms = Milestone(
            title=m["title"],
            due_date=dt_date.fromisoformat(m["due_date"].replace("Z", "").split("T")[0]) if m.get("due_date") else None,
        )
        p.milestones.append(ms)

    db.session.add(p)
    db.session.commit()

    # Auto-calculate progress
    _update_project_progress(p)
    return jsonify({"message": "Project created", "project": p.to_dict()}), 201


@career_bp.route("/projects/<pid>", methods=["PUT"])
@jwt_required()
def update_project(pid):
    """Update project details."""
    p = db.session.get(Project, pid)
    if not p or p.student_id != get_jwt_identity():
        return jsonify({"error": "Not found"}), 404
    data = request.get_json()
    if "title" in data: p.title = data["title"]
    if "description" in data: p.description = data["description"]
    if "status" in data: p.status = data["status"]
    if "deadline" in data and data["deadline"]:
        p.deadline = dt_date.fromisoformat(data["deadline"].replace("Z", "").split("T")[0])
    db.session.commit()
    return jsonify({"project": p.to_dict()}), 200


@career_bp.route("/projects/<pid>", methods=["DELETE"])
@jwt_required()
def delete_project(pid):
    """Delete a project."""
    p = db.session.get(Project, pid)
    if not p or p.student_id != get_jwt_identity():
        return jsonify({"error": "Not found"}), 404
    db.session.delete(p)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


@career_bp.route("/projects/<pid>/milestones", methods=["POST"])
@jwt_required()
def add_milestone(pid):
    """Add a milestone to a project."""
    p = db.session.get(Project, pid)
    if not p or p.student_id != get_jwt_identity():
        return jsonify({"error": "Not found"}), 404
    data = request.get_json()
    ms = Milestone(
        project_id=pid,
        title=data["title"],
        due_date=dt_date.fromisoformat(data["due_date"].replace("Z", "").split("T")[0]) if data.get("due_date") else None,
    )
    db.session.add(ms)
    db.session.commit()
    _update_project_progress(p)
    return jsonify({"message": "Milestone added", "project": p.to_dict()}), 201


@career_bp.route("/milestones/<mid>/toggle", methods=["POST"])
@jwt_required()
def toggle_milestone(mid):
    """Toggle a milestone's completion status."""
    ms = db.session.get(Milestone, mid)
    if not ms:
        return jsonify({"error": "Not found"}), 404
    ms.is_completed = not ms.is_completed
    ms.completed_at = datetime.now(timezone.utc) if ms.is_completed else None
    db.session.commit()
    _update_project_progress(ms.project)
    return jsonify({"milestone": ms.to_dict(), "project": ms.project.to_dict()}), 200


def _update_project_progress(project):
    """Recalculate project progress based on milestone completion."""
    milestones = list(project.milestones)
    if milestones:
        completed = sum(1 for m in milestones if m.is_completed)
        project.progress_pct = round((completed / len(milestones)) * 100)
        if project.progress_pct == 100:
            project.status = "completed"
        elif project.deadline and project.deadline < dt_date.today():
            project.status = "overdue"
        else:
            project.status = "in_progress"
    db.session.commit()


# ── Skill Badges ──────────────────────────────────────────────────

@career_bp.route("/badges", methods=["GET"])
@jwt_required()
def list_badges():
    """List all available badges."""
    badges = SkillBadge.query.filter_by(is_active=True).all()
    return jsonify({"badges": [b.to_dict() for b in badges]}), 200


@career_bp.route("/badges/my-badges", methods=["GET"])
@jwt_required()
def my_badges():
    """Get badges earned by the logged-in student."""
    earned = EarnedBadge.query.filter_by(student_id=get_jwt_identity())\
        .order_by(EarnedBadge.earned_at.desc()).all()
    return jsonify({"earned_badges": [e.to_dict() for e in earned]}), 200


@career_bp.route("/badges", methods=["POST"])
@jwt_required()
@role_required("admin", "faculty")
def create_badge():
    """Create a new badge template."""
    data = request.get_json()
    b = SkillBadge(
        name=data["name"], description=data.get("description"),
        category=data.get("category", "technical"),
        icon=data.get("icon", "award"), color=data.get("color", "#6366f1"),
        criteria=data.get("criteria"), points=data.get("points", 10),
    )
    db.session.add(b)
    db.session.commit()
    return jsonify({"message": "Badge created", "badge": b.to_dict()}), 201


@career_bp.route("/badges/<bid>/award", methods=["POST"])
@jwt_required()
@role_required("admin", "faculty")
def award_badge(bid):
    """Award a badge to a student."""
    data = request.get_json()
    earned = EarnedBadge(
        student_id=data["student_id"],
        badge_id=bid,
        awarded_by=get_jwt_identity(),
        note=data.get("note"),
    )
    db.session.add(earned)
    db.session.commit()
    return jsonify({"message": "Badge awarded", "earned": earned.to_dict()}), 201

