"""
Career API — Job Portal, Eligibility Check, Interviews, Company Prep, Alumni, Referrals,
              Project Reminders, Skill Badges, Team Finder, Portfolio Builder
"""

import json as json_lib
from datetime import datetime, timezone, date as dt_date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..middleware.auth_middleware import role_required
from ..models.career import (
    JobPosting, JobApplication, InterviewSchedule,
    CompanyPrepQuestion, AlumniProfile,
    Project, Milestone, SkillBadge, EarnedBadge,
    Internship, MockTest, MockTestQuestion, MockTestAttempt,
    TeamFinderProfile, TeamSwipe, TeamMatch, TeamMessage,
    Portfolio,
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
    """Get projects — students see their own, faculty sees mentee projects."""
    uid = get_jwt_identity()
    user = db.session.get(User, uid)
    if user and user.role == UserRole.FACULTY:
        # Faculty sees projects from all mentees
        mentees = User.query.filter_by(mentor_id=uid, role=UserRole.STUDENT).all()
        mentee_ids = [m.id for m in mentees]
        projects = Project.query.filter(Project.student_id.in_(mentee_ids))\
            .order_by(Project.created_at.desc()).all()
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
    if dept:
        user_ids = [u.id for u in User.query.filter_by(department=dept, role=UserRole.STUDENT).all()]
        query = query.filter(TeamFinderProfile.user_id.in_(user_ids))
    profiles = query.limit(20).all()
    result = []
    # Compute match percentage based on complementary skills
    my_profile = TeamFinderProfile.query.filter_by(user_id=uid).first()
    my_skills = set(s.strip().lower() for s in (my_profile.skills or "").split(",") if s.strip()) if my_profile else set()
    for p in profiles:
        d = p.to_dict()
        their_skills = set(s.strip().lower() for s in (p.skills or "").split(",") if s.strip())
        # Complementary: score higher for skills the user DOESN'T have
        if my_skills and their_skills:
            complementary = len(their_skills - my_skills)
            overlap = len(their_skills & my_skills)
            d["match_pct"] = min(95, 50 + complementary * 15 - overlap * 5)
        else:
            d["match_pct"] = 70
        if skill and skill.lower() not in [s.lower() for s in d.get("skills", [])]:
            continue
        result.append(d)
    result.sort(key=lambda x: x.get("match_pct", 0), reverse=True)
    return jsonify({"profiles": result}), 200


@career_bp.route("/team-finder/swipe", methods=["POST"])
@jwt_required()
def swipe_profile():
    """Swipe right (like) or left (skip) on a profile."""
    uid = get_jwt_identity()
    data = request.get_json()
    target_id = data["target_id"]
    direction = data["direction"]  # "right" or "left"
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
    qs = MockTestQuestion.query.filter_by(test_id=tid)\
        .order_by(MockTestQuestion.order_num).all()
    return jsonify({"questions": [q.to_dict(show_answer=False) for q in qs]}), 200


@career_bp.route("/mock-tests/<tid>/submit", methods=["POST"])
@jwt_required()
@role_required("student")
def submit_test(tid):
    """Submit answers and get score."""
    import json as json_lib
    data = request.get_json()
    answers = data.get("answers", {})  # {question_id: "a"}
    questions = MockTestQuestion.query.filter_by(test_id=tid).all()
    score = 0
    total = len(questions)
    results = []
    for q in questions:
        student_ans = answers.get(q.id, "")
        is_correct = student_ans.lower() == q.correct_option.lower()
        if is_correct:
            score += 1
        results.append({
            "question_id": q.id, "correct_option": q.correct_option,
            "student_answer": student_ans, "is_correct": is_correct,
            "explanation": q.explanation,
        })
    attempt = MockTestAttempt(
        test_id=tid, student_id=get_jwt_identity(),
        answers_json=json_lib.dumps(answers),
        score=score, total=total,
        time_taken_seconds=data.get("time_taken_seconds"),
    )
    db.session.add(attempt)
    db.session.commit()
    return jsonify({
        "score": score, "total": total,
        "percentage": round((score / total * 100) if total else 0),
        "results": results, "attempt": attempt.to_dict(),
    }), 200


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


