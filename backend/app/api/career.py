"""
Career API — Job Portal, Eligibility Check, Interviews, Company Prep, Alumni, Referrals,
              Project Reminders, Skill Badges, Team Finder, Portfolio Builder
"""

import json as json_lib
from datetime import datetime, timezone, timedelta, date as dt_date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..middleware.auth_middleware import role_required
from ..models.career import (
    JobPosting, JobApplication, InterviewSchedule,
    CompanyPrepQuestion, AlumniProfile,
    Project, Milestone, SkillBadge, EarnedBadge, SavedJob,
    Internship, MockTest, MockTestQuestion, MockTestAttempt,
    TeamFinderProfile, TeamSwipe, TeamMatch, TeamMessage,
    Portfolio, TeamReport,
)
from ..models.user import User, UserRole

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

@career_bp.route("/jobs/cleanup-resumes", methods=["POST"])
@jwt_required()
@role_required("admin")
def cleanup_old_resumes():
    """Simulate cleaning up resumes older than 30 days from application storage."""
    limit_date = datetime.now(timezone.utc) - timedelta(days=30)
    old_apps = JobApplication.query.filter(JobApplication.applied_at < limit_date).all()
    cleaned_count = 0
    for app in old_apps:
        if app.resume_url:
            app.resume_url = None
            cleaned_count += 1
    db.session.commit()
    return jsonify({
        "message": f"Successfully checked and cleared {cleaned_count} ephemeral resumes older than 30 days.",
        "purged_count": cleaned_count
    }), 200


# ── Eligibility Check ─────────────────────────────────────────────

@career_bp.route("/jobs/<jid>/check-eligibility", methods=["GET"])
@jwt_required()
@role_required("student")
def check_eligibility(jid):
    """Auto Yes/No based on CGPA and advanced rules."""
    job = db.session.get(JobPosting, jid)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    user = db.session.get(User, get_jwt_identity())
    
    reasons = []
    cgpa_ok = (user.cgpa or 0) >= (job.min_cgpa or 0)
    if not cgpa_ok:
        reasons.append(f"You need {(job.min_cgpa or 0) - (user.cgpa or 0):.1f} more CGPA")
        
    dept_ok = job.eligible_departments == "all" or (user.department or "") in job.eligible_departments
    if not dept_ok:
        reasons.append("Your department is not eligible")

    eligible = cgpa_ok and dept_ok
    match_pct = 100 if eligible else (50 if cgpa_ok or dept_ok else 10)
    
    return jsonify({
        "eligible": eligible,
        "match_percentage": match_pct,
        "reasons": reasons,
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


@career_bp.route("/jobs/<jid>/save", methods=["POST"])
@jwt_required()
@role_required("student")
def save_job(jid):
    """Bookmark a job posting."""
    uid = get_jwt_identity()
    existing = SavedJob.query.filter_by(student_id=uid, posting_id=jid).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({"message": "Job removed from saved", "saved": False}), 200
    
    sj = SavedJob(student_id=uid, posting_id=jid)
    db.session.add(sj)
    db.session.commit()
    return jsonify({"message": "Job saved", "saved": True}), 201


@career_bp.route("/jobs/saved", methods=["GET"])
@jwt_required()
@role_required("student")
def saved_jobs():
    """List saved jobs."""
    uid = get_jwt_identity()
    saved = SavedJob.query.filter_by(student_id=uid).all()
    postings = []
    for s in saved:
        p = db.session.get(JobPosting, s.posting_id)
        if p: postings.append(p.to_dict())
    return jsonify({"saved_jobs": postings}), 200


# ── Interview Scheduler ───────────────────────────────────────────

@career_bp.route("/interviews", methods=["GET"])
@jwt_required()
@role_required("student")
def my_interviews():
    """Get upcoming interview schedule."""
    schedules = InterviewSchedule.query.filter_by(student_id=get_jwt_identity())\
        .order_by(InterviewSchedule.scheduled_at).all()
    return jsonify({"interviews": [s.to_dict() for s in schedules]}), 200


@career_bp.route("/jobs/<jid>/interview-slots", methods=["GET"])
@jwt_required()
def get_interview_slots(jid):
    """Return available interview slots for a job."""
    # Mocking slots for Calendly style UI
    import datetime
    now = datetime.datetime.now()
    slots = []
    for i in range(1, 4):
        slot_time = now + datetime.timedelta(days=i, hours=2)
        slots.append({
            "id": f"slot-{i}",
            "time": slot_time.isoformat(),
            "available": True
        })
    return jsonify({"slots": slots}), 200


@career_bp.route("/jobs/<jid>/book-interview", methods=["POST"])
@jwt_required()
@role_required("student")
def book_interview(jid):
    """Book an interview slot."""
    data = request.get_json()
    uid = get_jwt_identity()
    
    # Conflict check
    existing = InterviewSchedule.query.filter_by(student_id=uid).all()
    # Simple mock check - in reality, parse and compare dates
    
    sch = InterviewSchedule(
        posting_id=jid,
        student_id=uid,
        round_name=data.get("round_name", "Technical Round 1"),
        scheduled_at=datetime.fromisoformat(data["time"].replace("Z", "").split(".")[0])
    )
    db.session.add(sch)
    db.session.commit()
    return jsonify({"message": "Slot booked successfully", "schedule": sch.to_dict()}), 201


# ── Company Prep ───────────────────────────────────────────────────

@career_bp.route("/prep/<company>", methods=["GET"])
@jwt_required()
def company_prep(company):
    """Get previous years' interview questions."""
    questions = CompanyPrepQuestion.query.filter(
        CompanyPrepQuestion.company_name.ilike(f"%{company}%")
    ).order_by(CompanyPrepQuestion.upvotes.desc()).all()
    return jsonify({"questions": [q.to_dict() for q in questions]}), 200

@career_bp.route("/prep/<company>/question", methods=["POST"])
@jwt_required()
def add_prep_question(company):
    data = request.get_json()
    q = CompanyPrepQuestion(
        company_name=company,
        question_text=data["question_text"],
        category=data.get("category", "technical"),
        year=data.get("year"),
        added_by=get_jwt_identity()
    )
    db.session.add(q)
    db.session.commit()
    return jsonify({"message": "Question added", "question": q.to_dict()}), 201

@career_bp.route("/prep/question/<qid>", methods=["PUT"])
@jwt_required()
@role_required("admin", "faculty")
def edit_prep_question(qid):
    q = db.session.get(CompanyPrepQuestion, qid)
    if not q:
        return jsonify({"error": "Question not found"}), 404
    data = request.get_json()
    q.question_text = data.get("question_text", q.question_text)
    q.category = data.get("category", q.category)
    q.year = data.get("year", q.year)
    db.session.commit()
    return jsonify({"message": "Question updated", "question": q.to_dict()}), 200

@career_bp.route("/prep/question/<qid>", methods=["DELETE"])
@jwt_required()
@role_required("admin", "faculty")
def delete_prep_question(qid):
    q = db.session.get(CompanyPrepQuestion, qid)
    if not q:
        return jsonify({"error": "Question not found"}), 404
    db.session.delete(q)
    db.session.commit()
    return jsonify({"message": "Question deleted"}), 200

@career_bp.route("/prep/question/<qid>/upvote", methods=["POST"])
@jwt_required()
def upvote_question(qid):
    q = db.session.get(CompanyPrepQuestion, qid)
    if not q:
        return jsonify({"error": "Not found"}), 404
    q.upvotes += 1
    db.session.commit()
    return jsonify({"message": "Upvoted", "upvotes": q.upvotes}), 200


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


# ── Internships ───────────────────────────────────────────────────

@career_bp.route("/internships/export", methods=["GET"])
@jwt_required()
@role_required("admin")
def export_internships():
    import csv
    from io import StringIO
    from flask import Response
    
    internships = Internship.query.all()
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['student_id', 'company_name', 'role_title', 'start_date', 'end_date', 'stipend', 'mode', 'status', 'is_verified'])
    for i in internships:
        cw.writerow([i.student_id, i.company_name, i.role_title, i.start_date, i.end_date, i.stipend, i.mode, i.status, i.is_verified])
    
    output = si.getvalue()
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=internships.csv"}
    )


# ── Project Reminders ─────────────────────────────────────────────

@career_bp.route("/projects/reminders/aggregated", methods=["GET"])
@jwt_required()
def get_aggregated_reminders():
    """Get aggregated upcoming milestones due in the next 7 days or overdue."""
    uid = get_jwt_identity()
    user = db.session.get(User, uid)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    fullname = user.full_name
    query = Project.query.filter(
        (Project.student_id == uid) | 
        (Project.team_members.ilike(f"%{fullname}%"))
    )
    projects = query.all()
    
    now = datetime.now(timezone.utc).date()
    seven_days_later = now + timedelta(days=7)
    
    due_milestones = []
    for p in projects:
        for m in p.milestones:
            if not m.is_completed and m.due_date:
                if m.due_date <= seven_days_later:
                    due_milestones.append({
                        "project_id": p.id,
                        "project_title": p.title,
                        "milestone_id": m.id,
                        "milestone_title": m.title,
                        "due_date": str(m.due_date),
                        "is_overdue": m.due_date < now
                    })
                    
    if not due_milestones:
        return jsonify({"has_reminders": False, "reminders": []}), 200
        
    if len(due_milestones) == 1:
        m = due_milestones[0]
        status = "overdue" if m["is_overdue"] else "due soon"
        message = f"Task '{m['milestone_title']}' in project '{m['project_title']}' is {status} (due {m['due_date']})."
        return jsonify({
            "has_reminders": True,
            "summary": f"1 task {status}",
            "message": message,
            "reminders": due_milestones
        }), 200
        
    overdue_count = sum(1 for m in due_milestones if m["is_overdue"])
    unique_projects = len(set(m["project_title"] for m in due_milestones))
    
    summary = f"{len(due_milestones)} tasks due"
    if overdue_count > 0:
        summary += f" ({overdue_count} overdue)"
        
    message = f"You have {len(due_milestones)} tasks due this week across {unique_projects} project(s)."
    return jsonify({
        "has_reminders": True,
        "summary": summary,
        "message": message,
        "reminders": due_milestones
    }), 200


@career_bp.route("/projects", methods=["GET"])
@jwt_required()
def my_projects():
    """Get projects — students see their own, faculty sees mentee and supervised projects."""
    uid = get_jwt_identity()
    user = db.session.get(User, uid)
    if user and user.role == UserRole.FACULTY:
        # Faculty sees projects from all mentees OR where they are the faculty_id
        mentees = User.query.filter_by(mentor_id=uid, role=UserRole.STUDENT).all()
        mentee_ids = [m.id for m in mentees]
        projects = Project.query.filter(
            (Project.student_id.in_(mentee_ids)) | (Project.faculty_id == uid)
        ).order_by(Project.created_at.desc()).all()
    else:
        projects = Project.query.filter_by(student_id=uid)\
            .order_by(Project.created_at.desc()).all()
    return jsonify({"projects": [p.to_dict() for p in projects]}), 200


@career_bp.route("/projects", methods=["POST"])
@jwt_required()
@role_required("student")
def create_project():
    """Create a new project with milestones."""
    data = request.get_json()
    fid = data.get("faculty_id")
    p = Project(
        student_id=get_jwt_identity(),
        title=data["title"],
        description=data.get("description"),
        subject_code=data.get("subject_code"),
        team_members=data.get("team_members"),
        faculty_id=fid if fid else None,
        faculty_status="pending" if fid else "approved"
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


@career_bp.route("/projects/<pid>/accept", methods=["POST"])
@jwt_required()
def accept_project(pid):
    """Faculty accepts student supervision request."""
    p = db.session.get(Project, pid)
    if not p:
        return jsonify({"error": "Project not found"}), 404
    uid = get_jwt_identity()
    user = db.session.get(User, uid)
    if not user or user.role != UserRole.FACULTY or p.faculty_id != uid:
        return jsonify({"error": "Unauthorized"}), 403
    p.faculty_status = "approved"
    p.status = "in_progress"
    db.session.commit()
    return jsonify({"message": "Project accepted successfully", "project": p.to_dict()}), 200


@career_bp.route("/projects/<pid>/decline", methods=["POST"])
@jwt_required()
def decline_project(pid):
    """Faculty declines student supervision request."""
    p = db.session.get(Project, pid)
    if not p:
        return jsonify({"error": "Project not found"}), 404
    uid = get_jwt_identity()
    user = db.session.get(User, uid)
    if not user or user.role != UserRole.FACULTY or p.faculty_id != uid:
        return jsonify({"error": "Unauthorized"}), 403
    p.faculty_status = "declined"
    p.status = "declined"
    db.session.commit()
    return jsonify({"message": "Project request declined", "project": p.to_dict()}), 200


@career_bp.route("/projects/<pid>/complete", methods=["POST"])
@jwt_required()
def complete_project(pid):
    """Faculty or Student marks project as completed."""
    p = db.session.get(Project, pid)
    if not p:
        return jsonify({"error": "Project not found"}), 404
    uid = get_jwt_identity()
    if p.student_id != uid and p.faculty_id != uid:
        return jsonify({"error": "Unauthorized"}), 403
    p.status = "completed"
    p.progress_pct = 100
    p.faculty_status = "completed"
    db.session.commit()
    return jsonify({"message": "Project completed", "project": p.to_dict()}), 200


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
    if "team_members" in data: p.team_members = data["team_members"]
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
        assigned_to=data.get("assigned_to"),
        column=data.get("column", "todo"),
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
    ms.column = "done" if ms.is_completed else "todo"
    db.session.commit()
    _update_project_progress(ms.project)
    return jsonify({"milestone": ms.to_dict(), "project": ms.project.to_dict()}), 200


@career_bp.route("/milestones/<mid>", methods=["PUT"])
@jwt_required()
def update_milestone(mid):
    """Update milestone fields — column (Kanban drag), assigned_to, title."""
    ms = db.session.get(Milestone, mid)
    if not ms:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json()
    if "column" in data:
        ms.column = data["column"]
        ms.is_completed = data["column"] == "done"
        ms.completed_at = datetime.now(timezone.utc) if ms.is_completed else None
    if "assigned_to" in data:
        ms.assigned_to = data["assigned_to"]
    if "title" in data:
        ms.title = data["title"]
    # Update project last-modified
    ms.project.last_modified_by = get_jwt_identity()
    ms.project.last_modified_at = datetime.now(timezone.utc)
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


@career_bp.route("/badges/<bid>", methods=["PUT"])
@jwt_required()
@role_required("admin", "faculty")
def edit_badge(bid):
    """Edit badge template details."""
    badge = db.session.get(SkillBadge, bid)
    if not badge:
        return jsonify({"error": "Badge template not found"}), 404
        
    data = request.get_json()
    if "name" in data:
        badge.name = data["name"]
    if "description" in data:
        badge.description = data["description"]
    if "category" in data:
        badge.category = data["category"]
    if "icon" in data:
        badge.icon = data["icon"]
    if "color" in data:
        badge.color = data["color"]
    if "criteria" in data:
        badge.criteria = data["criteria"]
    if "points" in data:
        badge.points = int(data["points"])
        
    db.session.commit()
    return jsonify({"message": "Badge updated successfully", "badge": badge.to_dict()}), 200


@career_bp.route("/badges/<bid>", methods=["DELETE"])
@jwt_required()
@role_required("admin", "faculty")
def delete_badge(bid):
    """Delete badge template."""
    badge = db.session.get(SkillBadge, bid)
    if not badge:
        return jsonify({"error": "Badge template not found"}), 404
        
    db.session.delete(badge)
    db.session.commit()
    return jsonify({"message": "Badge template deleted successfully"}), 200


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


@career_bp.route("/badges/auto-award", methods=["POST"])
@jwt_required()
@role_required("admin", "faculty")
def auto_award_badges():
    """Bulk-award a badge to multiple students (e.g. after a workshop)."""
    data = request.get_json()
    badge_id = data.get("badge_id")
    student_ids = data.get("student_ids", [])
    note = data.get("note", "Auto-awarded")
    awarded = []
    for sid in student_ids:
        existing = EarnedBadge.query.filter_by(student_id=sid, badge_id=badge_id).first()
        if not existing:
            e = EarnedBadge(student_id=sid, badge_id=badge_id, awarded_by=get_jwt_identity(), note=note)
            db.session.add(e)
            awarded.append(sid)
    db.session.commit()
    return jsonify({"message": f"{len(awarded)} badges awarded", "awarded_to": awarded}), 200


@career_bp.route("/badges/webhook/workshop", methods=["POST"])
def webhook_award_badge():
    """
    Automated webhook endpoint from external workshop attendance systems.
    Accepts: { "workshop_id": "...", "badge_id": "...", "student_emails": [...] }
    """
    data = request.get_json() or {}
    badge_id = data.get("badge_id")
    student_emails = data.get("student_emails", [])
    workshop_id = data.get("workshop_id", "Unknown Workshop")
    
    badge = db.session.get(SkillBadge, badge_id)
    if not badge:
        return jsonify({"error": "Badge not found"}), 404
        
    awarded_count = 0
    awarded_students = []
    
    for email in student_emails:
        student = User.query.filter_by(email=email, role=UserRole.STUDENT).first()
        if student:
            existing = EarnedBadge.query.filter_by(student_id=student.id, badge_id=badge_id).first()
            if not existing:
                e = EarnedBadge(
                    student_id=student.id,
                    badge_id=badge_id,
                    note=f"Automatically awarded via workshop sync for {workshop_id}."
                )
                db.session.add(e)
                awarded_count += 1
                awarded_students.append(student.full_name)
                
    db.session.commit()
    return jsonify({
        "status": "success",
        "message": f"Successfully processed workshop webhook. Awarded {awarded_count} badges.",
        "awarded_count": awarded_count,
        "awarded_students": awarded_students
    }), 200


@career_bp.route("/badges/<bid>/holders", methods=["GET"])
@jwt_required()
def badge_holders(bid):
    """List all students who earned a specific badge."""
    earned = EarnedBadge.query.filter_by(badge_id=bid).all()
    holders = []
    for e in earned:
        u = db.session.get(User, e.student_id)
        if u:
            holders.append({
                "student_id": u.id, "name": u.full_name, "department": u.department,
                "earned_at": e.earned_at.isoformat() if e.earned_at else None,
            })
    return jsonify({"holders": holders}), 200


@career_bp.route("/badges/claims", methods=["POST"])
@jwt_required()
@role_required("student")
def claim_badge():
    """Student nominates themselves or claims a badge with note/proof."""
    data = request.get_json()
    badge_id = data.get("badge_id")
    note = data.get("note") # proof description or outside college event info
    
    if not badge_id:
        return jsonify({"error": "badge_id is required"}), 400
        
    # Check if already earned or claimed
    existing = EarnedBadge.query.filter_by(
        student_id=get_jwt_identity(), badge_id=badge_id
    ).first()
    if existing:
        if existing.status == "pending":
            return jsonify({"error": "Badge claim is already pending approval"}), 400
        return jsonify({"error": "Badge has already been earned"}), 400
        
    eb = EarnedBadge(
        student_id=get_jwt_identity(),
        badge_id=badge_id,
        note=note,
        status="pending"
    )
    db.session.add(eb)
    db.session.commit()
    return jsonify({"message": "Badge claim submitted successfully", "claim": eb.to_dict()}), 201


@career_bp.route("/badges/claim-volunteer", methods=["POST"])
@jwt_required()
@role_required("student")
def claim_volunteer_badge():
    """Instantly claim and approve the Volunteer Excellence badge for a student."""
    from ..models.career import SkillBadge, EarnedBadge
    student_id = get_jwt_identity()
    
    badge = SkillBadge.query.filter_by(name="Volunteer Excellence").first()
    if not badge:
        badge = SkillBadge(
            name="Volunteer Excellence",
            description="Earned by completing 30+ hours of verified volunteering and event coordination duty.",
            category="soft_skill",
            icon="award",
            color="#eab308",
            points=100,
            criteria="Complete at least 30 hours of verified volunteering duty."
        )
        db.session.add(badge)
        db.session.commit()

    existing = EarnedBadge.query.filter_by(student_id=student_id, badge_id=badge.id).first()
    if existing:
        return jsonify({"message": "Badge already claimed", "earned_badge": existing.to_dict()}), 200

    eb = EarnedBadge(
        student_id=student_id,
        badge_id=badge.id,
        note="Awarded automatically for completing 30+ hours of volunteering duty.",
        status="approved"
    )
    db.session.add(eb)
    db.session.commit()
    
    return jsonify({"message": "Volunteer Excellence Badge claimed successfully!", "earned_badge": eb.to_dict()}), 201



@career_bp.route("/badges/claims/pending", methods=["GET"])
@jwt_required()
@role_required("admin", "faculty")
def pending_badge_claims():
    """Retrieve all pending badge claims/nominations."""
    claims = EarnedBadge.query.filter_by(status="pending").all()
    res = []
    for c in claims:
        d = c.to_dict()
        student = db.session.get(User, c.student_id)
        if student:
            d["student_name"] = student.full_name
            d["student_roll"] = student.roll_number
            d["student_email"] = student.email
            d["student_department"] = student.department
        res.append(d)
    return jsonify({"claims": res}), 200


@career_bp.route("/badges/claims/<claim_id>", methods=["PUT"])
@jwt_required()
@role_required("admin", "faculty")
def resolve_badge_claim(claim_id):
    """Approve or reject a student badge claim nomination."""
    earned = db.session.get(EarnedBadge, claim_id)
    if not earned:
        return jsonify({"error": "Claim not found"}), 404
        
    data = request.get_json()
    status = data.get("status") # approved / rejected
    if status not in ("approved", "rejected"):
        return jsonify({"error": "Invalid status"}), 400
        
    earned.status = status
    earned.awarded_by = get_jwt_identity()
    if data.get("note"):
        earned.note = data.get("note")
        
    db.session.commit()
    return jsonify({"message": f"Badge claim {status}", "earned": earned.to_dict()}), 200


# ── Team Finder ───────────────────────────────────────────────────

@career_bp.route("/team-finder/profile", methods=["GET"])
@jwt_required()
def get_my_tf_profile():
    """Get the current user's team finder profile."""
    profile = TeamFinderProfile.query.filter_by(user_id=get_jwt_identity()).first()
    return jsonify({"profile": profile.to_dict() if profile else None}), 200


@career_bp.route("/team-finder/profile", methods=["POST"])
@jwt_required()
def upsert_tf_profile():
    """Create or update the team finder profile."""
    uid = get_jwt_identity()
    data = request.get_json()
    profile = TeamFinderProfile.query.filter_by(user_id=uid).first()
    if not profile:
        profile = TeamFinderProfile(user_id=uid)
        db.session.add(profile)
    if "skills" in data:
        skills = data["skills"]
        profile.skills = ",".join(skills) if isinstance(skills, list) else skills
    if "looking_for" in data:
        profile.looking_for = data["looking_for"]
    if "bio" in data:
        profile.bio = data["bio"]
    if "is_active" in data:
        profile.is_active = data["is_active"]
    db.session.commit()
    return jsonify({"profile": profile.to_dict()}), 200


@career_bp.route("/team-finder/profiles", methods=["GET"])
@jwt_required()
def list_tf_profiles():
    """Get profiles for swiping — excludes self and already-swiped users."""
    uid = get_jwt_identity()
    # Get IDs already swiped
    swiped = db.session.query(TeamSwipe.target_id).filter_by(swiper_id=uid).subquery()
    # Filter: active, not self, not swiped
    query = TeamFinderProfile.query.filter(
        TeamFinderProfile.user_id != uid,
        TeamFinderProfile.is_active == True,
        ~TeamFinderProfile.user_id.in_(swiped)
    )
    # Optional filters
    dept = request.args.get("department")
    skill = request.args.get("skill")
    year = request.args.get("year")  # "1", "2", "3", "4"
    complementary_only = request.args.get("complementary") == "true"
    
    if dept:
        user_ids = [u.id for u in User.query.filter_by(department=dept, role=UserRole.STUDENT).all()]
        query = query.filter(TeamFinderProfile.user_id.in_(user_ids))
        
    if year:
        # Semester bounds for year
        # 1st Year: sem 1-2, 2nd Year: sem 3-4, 3rd Year: sem 5-6, 4th Year: sem 7-8
        try:
            y = int(year)
            min_sem = (y * 2) - 1
            max_sem = y * 2
            user_ids = [u.id for u in User.query.filter(
                User.semester >= min_sem, User.semester <= max_sem, User.role == UserRole.STUDENT
            ).all()]
            query = query.filter(TeamFinderProfile.user_id.in_(user_ids))
        except ValueError:
            pass

    profiles = query.limit(40).all()
    result = []
    # Compute match percentage based on complementary skills
    my_profile = TeamFinderProfile.query.filter_by(user_id=uid).first()
    my_skills = set(s.strip().lower() for s in (my_profile.skills or "").split(",") if s.strip()) if my_profile else set()
    
    for p in profiles:
        d = p.to_dict()
        their_skills = set(s.strip().lower() for s in (p.skills or "").split(",") if s.strip())
        
        # Complementary: score higher for skills the user DOESN'T have
        complementary_score = 0
        if my_skills and their_skills:
            complementary_diff = their_skills - my_skills
            complementary_score = len(complementary_diff)
            overlap = len(their_skills & my_skills)
            d["match_pct"] = min(95, 50 + complementary_score * 15 - overlap * 5)
        else:
            d["match_pct"] = 70
            
        if skill and skill.lower() not in [s.lower() for s in d.get("skills", [])]:
            continue
            
        if complementary_only and complementary_score == 0:
            continue
            
        result.append(d)
        
    result.sort(key=lambda x: x.get("match_pct", 0), reverse=True)
    return jsonify({"profiles": result}), 200


@career_bp.route("/team-finder/swipe", methods=["POST"])
@jwt_required()
def swipe_profile():
    """Swipe right (like) or left (skip) on a profile. Rate-limited to 20 swipes per hour."""
    uid = get_jwt_identity()
    data = request.get_json()
    target_id = data["target_id"]
    direction = data["direction"]  # "right" or "left"
    
    # Rate limit check: max 20 swipes in the last hour
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    swipe_count = TeamSwipe.query.filter_by(swiper_id=uid).filter(TeamSwipe.created_at >= one_hour_ago).count()
    if swipe_count >= 20:
        return jsonify({
            "error": "Swipe limit reached",
            "message": "You have reached the maximum limit of 20 swipes per hour. Please try again later."
        }), 429
        
    # Prevent duplicate
    existing = TeamSwipe.query.filter_by(swiper_id=uid, target_id=target_id).first()
    if existing:
        return jsonify({"message": "Already swiped"}), 200
        
    swipe = TeamSwipe(swiper_id=uid, target_id=target_id, direction=direction)
    db.session.add(swipe)
    db.session.commit()
    # Check for mutual match
    is_match = False
    if direction == "right":
        reverse = TeamSwipe.query.filter_by(swiper_id=target_id, target_id=uid, direction="right").first()
        if reverse:
            # Create match!
            match = TeamMatch(user1_id=uid, user2_id=target_id)
            db.session.add(match)
            db.session.commit()
            is_match = True
    return jsonify({"message": "Swiped", "is_match": is_match}), 200


@career_bp.route("/team-finder/report", methods=["POST"])
@jwt_required()
def report_user():
    """Report a user for inappropriate behavior in Team Finder."""
    uid = get_jwt_identity()
    data = request.get_json()
    reported_id = data["reported_id"]
    reason = data["reason"]
    
    if not reported_id or not reason:
        return jsonify({"error": "Missing reported_id or reason"}), 400
        
    # Save the report
    report = TeamReport(reporter_id=uid, reported_id=reported_id, reason=reason)
    db.session.add(report)
    
    # Auto-swipe left to remove from discover stack
    existing_swipe = TeamSwipe.query.filter_by(swiper_id=uid, target_id=reported_id).first()
    if not existing_swipe:
        swipe = TeamSwipe(swiper_id=uid, target_id=reported_id, direction="left")
        db.session.add(swipe)
        
    db.session.commit()
    return jsonify({"message": "Report submitted successfully. The user has been flagged and blocked."}), 201


@career_bp.route("/team-finder/matches", methods=["GET"])
@jwt_required()
def my_matches():
    """Get mutual matches for the current user."""
    uid = get_jwt_identity()
    matches = TeamMatch.query.filter(
        (TeamMatch.user1_id == uid) | (TeamMatch.user2_id == uid)
    ).order_by(TeamMatch.matched_at.desc()).all()
    result = []
    for m in matches:
        d = m.to_dict()
        # Add the "other" user for convenience
        other_id = m.user2_id if m.user1_id == uid else m.user1_id
        other = db.session.get(User, other_id)
        profile = TeamFinderProfile.query.filter_by(user_id=other_id).first()
        d["other_user"] = {
            "id": other.id, "name": other.full_name,
            "department": other.department,
            "skills": profile.skills.split(",") if profile and profile.skills else [],
        } if other else None
        result.append(d)
    return jsonify({"matches": result}), 200


@career_bp.route("/team-finder/messages/<match_id>", methods=["GET"])
@jwt_required()
def get_messages(match_id):
    """Get chat messages for a match."""
    messages = TeamMessage.query.filter_by(match_id=match_id)\
        .order_by(TeamMessage.sent_at.asc()).all()
    return jsonify({"messages": [m.to_dict() for m in messages]}), 200


@career_bp.route("/team-finder/messages/<match_id>", methods=["POST"])
@jwt_required()
def send_message(match_id):
    """Send a chat message in a match."""
    data = request.get_json()
    msg = TeamMessage(
        match_id=match_id, sender_id=get_jwt_identity(),
        content=data["content"],
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": msg.to_dict()}), 201


# ── Portfolio Builder ─────────────────────────────────────────────

@career_bp.route("/portfolio", methods=["GET"])
@jwt_required()
def get_portfolio():
    """Get portfolio for the current user."""
    p = Portfolio.query.filter_by(user_id=get_jwt_identity()).first()
    return jsonify({"portfolio": p.to_dict() if p else None}), 200


@career_bp.route("/portfolio", methods=["PUT"])
@jwt_required()
def save_portfolio():
    """Save/update portfolio data."""
    uid = get_jwt_identity()
    data = request.get_json()
    p = Portfolio.query.filter_by(user_id=uid).first()
    if not p:
        # Generate a slug from user name
        user = db.session.get(User, uid)
        slug = (user.full_name.lower().replace(" ", "-") + "-" + uid[:6]) if user else uid[:12]
        p = Portfolio(user_id=uid, public_slug=slug)
        db.session.add(p)
    if "template" in data:
        p.template = data["template"]
    if "data" in data:
        p.data_json = json_lib.dumps(data["data"])
    if "is_public" in data:
        p.is_public = data["is_public"]
    db.session.commit()
    return jsonify({"portfolio": p.to_dict()}), 200


@career_bp.route("/portfolio/public/<slug>", methods=["GET"])
def public_portfolio(slug):
    """Public portfolio view — no auth required."""
    p = Portfolio.query.filter_by(public_slug=slug, is_public=True).first()
    if not p:
        return jsonify({"error": "Portfolio not found"}), 404
    p.view_count = (p.view_count or 0) + 1
    db.session.commit()
    user = db.session.get(User, p.user_id)
    result = p.to_dict()
    result["user_name"] = user.full_name if user else "Unknown"
    return jsonify({"portfolio": result}), 200


# ── Internship Tracker ────────────────────────────────────────────

@career_bp.route("/internships", methods=["GET"])
@jwt_required()
def my_internships():
    """Get all internships for the logged-in student."""
    internships = Internship.query.filter_by(student_id=get_jwt_identity())\
        .order_by(Internship.start_date.desc()).all()
    return jsonify({"internships": [i.to_dict() for i in internships]}), 200


@career_bp.route("/internships", methods=["POST"])
@jwt_required()
@role_required("student")
def add_internship():
    """Record a new internship."""
    data = request.get_json()
    i = Internship(
        student_id=get_jwt_identity(),
        company_name=data["company_name"], role_title=data["role_title"],
        description=data.get("description"),
        start_date=dt_date.fromisoformat(data["start_date"].split("T")[0]),
        end_date=dt_date.fromisoformat(data["end_date"].split("T")[0]) if data.get("end_date") else None,
        stipend=data.get("stipend"), mode=data.get("mode", "onsite"),
        certificate_url=data.get("certificate_url"),
        status=data.get("status", "ongoing"),
        skills_learned=data.get("skills_learned"),
    )
    db.session.add(i)
    db.session.commit()
    return jsonify({"message": "Internship added", "internship": i.to_dict()}), 201


@career_bp.route("/internships/<iid>", methods=["PUT"])
@jwt_required()
def update_internship(iid):
    """Update an internship record."""
    i = db.session.get(Internship, iid)
    if not i or i.student_id != get_jwt_identity():
        return jsonify({"error": "Not found"}), 404
    data = request.get_json()
    for field in ["company_name", "role_title", "description", "stipend", "mode",
                  "certificate_url", "status", "skills_learned"]:
        if field in data:
            setattr(i, field, data[field])
    if "end_date" in data and data["end_date"]:
        i.end_date = dt_date.fromisoformat(data["end_date"].split("T")[0])
    db.session.commit()
    return jsonify({"internship": i.to_dict()}), 200


@career_bp.route("/internships/<iid>", methods=["DELETE"])
@jwt_required()
def delete_internship(iid):
    i = db.session.get(Internship, iid)
    if not i or i.student_id != get_jwt_identity():
        return jsonify({"error": "Not found"}), 404
    db.session.delete(i)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


# ── Mock Test Portal ──────────────────────────────────────────────

@career_bp.route("/mock-tests", methods=["GET"])
@jwt_required()
def list_mock_tests():
    """List available mock tests."""
    cat = request.args.get("category")
    query = MockTest.query.filter_by(is_active=True)
    if cat:
        query = query.filter_by(category=cat)
    tests = query.order_by(MockTest.created_at.desc()).all()
    return jsonify({"tests": [t.to_dict() for t in tests]}), 200


@career_bp.route("/mock-tests/<tid>/questions", methods=["GET"])
@jwt_required()
def get_test_questions(tid):
    """Get questions for a test (no answers revealed)."""
    user = db.session.get(User, get_jwt_identity())
    if user and user.role.value == "student":
        return jsonify({"error": "Mock tests are suspended as part of VelTech Premium upgrade v1.0. Please contact administration."}), 403
    qs = MockTestQuestion.query.filter_by(test_id=tid)\
        .order_by(MockTestQuestion.order_num).all()
    return jsonify({"questions": [q.to_dict(show_answer=False) for q in qs]}), 200


@career_bp.route("/mock-tests/<tid>/submit", methods=["POST"])
@jwt_required()
@role_required("student")
def submit_test(tid):
    """Submit answers and get score."""
    return jsonify({"error": "Mock tests are suspended as part of VelTech Premium upgrade v1.0. Please contact administration."}), 403


@career_bp.route("/mock-tests/my-attempts", methods=["GET"])
@jwt_required()
def my_attempts():
    """Get student's test attempt history."""
    attempts = MockTestAttempt.query.filter_by(student_id=get_jwt_identity())\
        .order_by(MockTestAttempt.completed_at.desc()).all()
    return jsonify({"attempts": [a.to_dict() for a in attempts]}), 200


@career_bp.route("/mock-tests", methods=["POST"])
@jwt_required()
@role_required("admin", "faculty")
def create_mock_test():
    """Create a mock test with questions."""
    data = request.get_json()
    t = MockTest(
        title=data["title"], description=data.get("description"),
        category=data.get("category", "aptitude"),
        duration_minutes=data.get("duration_minutes", 30),
        difficulty=data.get("difficulty", "medium"),
        created_by=get_jwt_identity(),
    )
    questions = data.get("questions", [])
    t.total_questions = len(questions)
    for idx, qd in enumerate(questions):
        q = MockTestQuestion(
            question_text=qd["question_text"],
            option_a=qd["option_a"], option_b=qd["option_b"],
            option_c=qd["option_c"], option_d=qd["option_d"],
            correct_option=qd["correct_option"],
            explanation=qd.get("explanation"),
            order_num=idx,
        )
        t.questions.append(q)
    db.session.add(t)
    db.session.commit()
    return jsonify({"message": "Test created", "test": t.to_dict()}), 201

@career_bp.route("/mock-tests/<tid>", methods=["PUT"])
@jwt_required()
@role_required("admin", "faculty")
def edit_mock_test(tid):
    t = db.session.get(MockTest, tid)
    if not t:
        return jsonify({"error": "Mock test not found"}), 404
    data = request.get_json()
    t.title = data.get("title", t.title)
    t.description = data.get("description", t.description)
    t.category = data.get("category", t.category)
    t.duration_minutes = data.get("duration_minutes", t.duration_minutes)
    t.difficulty = data.get("difficulty", t.difficulty)
    db.session.commit()
    return jsonify({"message": "Test updated", "test": t.to_dict()}), 200

@career_bp.route("/mock-tests/<tid>", methods=["DELETE"])
@jwt_required()
@role_required("admin", "faculty")
def delete_mock_test(tid):
    t = db.session.get(MockTest, tid)
    if not t:
        return jsonify({"error": "Mock test not found"}), 404
    db.session.delete(t)
    db.session.commit()
    return jsonify({"message": "Test deleted"}), 200


