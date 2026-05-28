"""
Career & Placement Models, Faculty Module Models, Health/Utility Models
"""

import uuid
from datetime import datetime, timezone
from ..extensions import db


# ── Project Reminders & Milestones ──────────────────────────────────

class Project(db.Model):
    __tablename__ = "projects"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    subject_code = db.Column(db.String(20), nullable=True)
    team_members = db.Column(db.Text, nullable=True)  # comma-separated names
    deadline = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), default="in_progress")  # in_progress, completed, overdue
    progress_pct = db.Column(db.Integer, default=0)
    last_modified_by = db.Column(db.String(36), nullable=True)
    last_modified_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    milestones = db.relationship("Milestone", backref="project", lazy="dynamic",
                                 cascade="all, delete-orphan", order_by="Milestone.due_date")

    def to_dict(self):
        return {
            "id": self.id, "student_id": self.student_id, "title": self.title,
            "description": self.description, "subject_code": self.subject_code,
            "team_members": self.team_members, "deadline": str(self.deadline) if self.deadline else None,
            "status": self.status, "progress_pct": self.progress_pct,
            "last_modified_by": self.last_modified_by,
            "last_modified_at": self.last_modified_at.isoformat() if self.last_modified_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "milestones": [m.to_dict() for m in self.milestones],
        }


class Milestone(db.Model):
    __tablename__ = "milestones"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    due_date = db.Column(db.Date, nullable=True)
    is_completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    column = db.Column(db.String(20), default="todo")  # todo, in_progress, done
    assigned_to = db.Column(db.String(200), nullable=True)  # team member name
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id, "project_id": self.project_id, "title": self.title,
            "due_date": str(self.due_date) if self.due_date else None,
            "is_completed": self.is_completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "column": self.column, "assigned_to": self.assigned_to,
        }


# ── Skill Badges ────────────────────────────────────────────────────

class SkillBadge(db.Model):
    """Badge templates created by admin/faculty."""
    __tablename__ = "skill_badges"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), default="technical")  # technical, soft_skill, workshop, hackathon
    icon = db.Column(db.String(50), default="award")  # lucide icon name
    color = db.Column(db.String(20), default="#6366f1")
    criteria = db.Column(db.Text, nullable=True)  # what is needed to earn
    points = db.Column(db.Integer, default=10)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "description": self.description,
            "category": self.category, "icon": self.icon, "color": self.color,
            "criteria": self.criteria, "points": self.points,
        }


class EarnedBadge(db.Model):
    """Record of a student earning a badge."""
    __tablename__ = "earned_badges"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    badge_id = db.Column(db.String(36), db.ForeignKey("skill_badges.id"), nullable=False)
    awarded_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    note = db.Column(db.String(500), nullable=True)
    earned_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    badge = db.relationship("SkillBadge", backref="earned_badges")

    def to_dict(self):
        return {
            "id": self.id, "student_id": self.student_id,
            "badge": self.badge.to_dict() if self.badge else None,
            "note": self.note,
            "earned_at": self.earned_at.isoformat() if self.earned_at else None,
        }


# ── Team Finder ─────────────────────────────────────────────────────

class TeamFinderProfile(db.Model):
    """Student profile for team matching."""
    __tablename__ = "team_finder_profiles"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), unique=True, nullable=False)
    skills = db.Column(db.Text, nullable=True)  # comma-separated: "React,Node.js,Python"
    looking_for = db.Column(db.String(500), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    user = db.relationship("User", backref=db.backref("team_profile", uselist=False))

    def to_dict(self):
        from ..models.user import User
        u = db.session.get(User, self.user_id)
        return {
            "id": self.id, "user_id": self.user_id,
            "name": u.full_name if u else "Unknown",
            "department": u.department if u else None,
            "semester": u.semester if u else None,
            "year": f"{((u.semester or 0) + 1) // 2}{'st' if ((u.semester or 0) + 1) // 2 == 1 else 'nd' if ((u.semester or 0) + 1) // 2 == 2 else 'rd' if ((u.semester or 0) + 1) // 2 == 3 else 'th'} Year" if u and u.semester else None,
            "avatar_url": u.avatar_url if u else None,
            "skills": self.skills.split(",") if self.skills else [],
            "looking_for": self.looking_for, "bio": self.bio,
            "is_active": self.is_active,
        }


class TeamSwipe(db.Model):
    """Record of a user swiping left/right on another."""
    __tablename__ = "team_swipes"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    swiper_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    target_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    direction = db.Column(db.String(10), nullable=False)  # right (like) or left (skip)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    __table_args__ = (db.UniqueConstraint("swiper_id", "target_id", name="uq_swipe"),)


class TeamMatch(db.Model):
    """Mutual match between two users."""
    __tablename__ = "team_matches"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user1_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    user2_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    matched_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        from ..models.user import User
        u1 = db.session.get(User, self.user1_id)
        u2 = db.session.get(User, self.user2_id)
        return {
            "id": self.id,
            "user1": {"id": u1.id, "name": u1.full_name, "department": u1.department} if u1 else None,
            "user2": {"id": u2.id, "name": u2.full_name, "department": u2.department} if u2 else None,
            "matched_at": self.matched_at.isoformat() if self.matched_at else None,
        }


class TeamMessage(db.Model):
    """Chat messages between matched team members."""
    __tablename__ = "team_messages"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    match_id = db.Column(db.String(36), db.ForeignKey("team_matches.id", ondelete="CASCADE"), nullable=False)
    sender_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    sent_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        from ..models.user import User
        sender = db.session.get(User, self.sender_id)
        return {
            "id": self.id, "match_id": self.match_id,
            "sender_id": self.sender_id,
            "sender_name": sender.full_name if sender else "Unknown",
            "content": self.content,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
        }


# ── Portfolio Builder ──────────────────────────────────────────────

class Portfolio(db.Model):
    """Student portfolio / resume data stored as JSON."""
    __tablename__ = "portfolios"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), unique=True, nullable=False)
    template = db.Column(db.String(30), default="modern")  # modern, classic, creative, minimal
    data_json = db.Column(db.Text, nullable=True)  # JSON blob with all portfolio data
    public_slug = db.Column(db.String(50), unique=True, nullable=True)
    is_public = db.Column(db.Boolean, default=False)
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        import json
        return {
            "id": self.id, "user_id": self.user_id,
            "template": self.template,
            "data": json.loads(self.data_json) if self.data_json else {},
            "public_slug": self.public_slug, "is_public": self.is_public,
            "view_count": self.view_count,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# ── Internship Tracker ──────────────────────────────────────────────

class Internship(db.Model):
    __tablename__ = "internships"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    company_name = db.Column(db.String(200), nullable=False)
    role_title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    stipend = db.Column(db.Float, nullable=True)
    mode = db.Column(db.String(20), default="onsite")  # onsite, remote, hybrid
    certificate_url = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), default="ongoing")  # ongoing, completed
    skills_learned = db.Column(db.Text, nullable=True)  # comma-separated
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id, "student_id": self.student_id,
            "company_name": self.company_name, "role_title": self.role_title,
            "description": self.description,
            "start_date": str(self.start_date) if self.start_date else None,
            "end_date": str(self.end_date) if self.end_date else None,
            "stipend": self.stipend, "mode": self.mode,
            "certificate_url": self.certificate_url, "status": self.status,
            "skills_learned": self.skills_learned,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ── Mock Test Portal ───────────────────────────────────────────────

class MockTest(db.Model):
    __tablename__ = "mock_tests"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), default="aptitude")  # aptitude, technical, verbal, coding
    duration_minutes = db.Column(db.Integer, default=30)
    total_questions = db.Column(db.Integer, default=20)
    difficulty = db.Column(db.String(20), default="medium")  # easy, medium, hard
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.String(36), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    questions = db.relationship("MockTestQuestion", backref="test", lazy="dynamic",
                                cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id, "title": self.title, "description": self.description,
            "category": self.category, "duration_minutes": self.duration_minutes,
            "total_questions": self.total_questions, "difficulty": self.difficulty,
        }


class MockTestQuestion(db.Model):
    __tablename__ = "mock_test_questions"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    test_id = db.Column(db.String(36), db.ForeignKey("mock_tests.id", ondelete="CASCADE"), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(500), nullable=False)
    option_b = db.Column(db.String(500), nullable=False)
    option_c = db.Column(db.String(500), nullable=False)
    option_d = db.Column(db.String(500), nullable=False)
    correct_option = db.Column(db.String(1), nullable=False)  # a, b, c, d
    explanation = db.Column(db.Text, nullable=True)
    order_num = db.Column(db.Integer, default=0)

    def to_dict(self, show_answer=False):
        d = {
            "id": self.id, "question_text": self.question_text,
            "option_a": self.option_a, "option_b": self.option_b,
            "option_c": self.option_c, "option_d": self.option_d,
            "order_num": self.order_num,
        }
        if show_answer:
            d["correct_option"] = self.correct_option
            d["explanation"] = self.explanation
        return d


class MockTestAttempt(db.Model):
    __tablename__ = "mock_test_attempts"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    test_id = db.Column(db.String(36), db.ForeignKey("mock_tests.id"), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    answers_json = db.Column(db.Text, nullable=True)  # JSON: {question_id: "a", ...}
    score = db.Column(db.Integer, default=0)
    total = db.Column(db.Integer, default=0)
    time_taken_seconds = db.Column(db.Integer, nullable=True)
    completed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id, "test_id": self.test_id,
            "score": self.score, "total": self.total,
            "time_taken_seconds": self.time_taken_seconds,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


# ── Career / Placements ────────────────────────────────────────────

class JobPosting(db.Model):
    __tablename__ = "job_postings"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name = db.Column(db.String(200), nullable=False)
    role_title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    package_lpa = db.Column(db.Float, nullable=True)
    min_cgpa = db.Column(db.Float, default=0.0)
    eligible_departments = db.Column(db.String(500), default="all")
    eligible_batch_year = db.Column(db.Integer, nullable=True)
    drive_date = db.Column(db.Date, nullable=True)
    last_date_apply = db.Column(db.Date, nullable=True)
    job_type = db.Column(db.String(30), default="placement")  # placement, internship
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    applications = db.relationship("JobApplication", backref="posting", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "company_name": self.company_name, "role_title": self.role_title,
                "description": self.description, "package_lpa": self.package_lpa,
                "min_cgpa": self.min_cgpa, "eligible_departments": self.eligible_departments,
                "drive_date": str(self.drive_date) if self.drive_date else None,
                "last_date_apply": str(self.last_date_apply) if self.last_date_apply else None,
                "job_type": self.job_type, "is_active": self.is_active}


class JobApplication(db.Model):
    __tablename__ = "job_applications"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    posting_id = db.Column(db.String(36), db.ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(30), default="applied")  # applied, shortlisted, selected, rejected
    resume_url = db.Column(db.String(500), nullable=True)
    applied_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "posting_id": self.posting_id, "student_id": self.student_id,
                "status": self.status, "applied_at": self.applied_at.isoformat() if self.applied_at else None}


class SavedJob(db.Model):
    __tablename__ = "saved_jobs"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    posting_id = db.Column(db.String(36), db.ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    saved_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class InterviewSchedule(db.Model):
    __tablename__ = "interview_schedules"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    posting_id = db.Column(db.String(36), db.ForeignKey("job_postings.id"), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    round_name = db.Column(db.String(100), nullable=False)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    venue = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(20), default="scheduled")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "posting_id": self.posting_id, "round_name": self.round_name,
                "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
                "venue": self.venue, "status": self.status}


class CompanyPrepQuestion(db.Model):
    __tablename__ = "company_prep_questions"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name = db.Column(db.String(200), nullable=False, index=True)
    question_text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default="technical")  # technical, aptitude, hr
    year = db.Column(db.Integer, nullable=True)
    added_by = db.Column(db.String(36), nullable=True)
    upvotes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "company_name": self.company_name,
                "question_text": self.question_text, "category": self.category, "year": self.year, "upvotes": self.upvotes}


class AlumniProfile(db.Model):
    __tablename__ = "alumni_profiles"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    batch_year = db.Column(db.Integer, nullable=False)
    department = db.Column(db.String(100), nullable=False)
    company = db.Column(db.String(200), nullable=True)
    designation = db.Column(db.String(200), nullable=True)
    linkedin_url = db.Column(db.String(500), nullable=True)
    is_open_to_referral = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "name": self.name, "batch_year": self.batch_year,
                "department": self.department, "company": self.company,
                "designation": self.designation, "is_open_to_referral": self.is_open_to_referral}


# ── Faculty Module ─────────────────────────────────────────────────

class LeaveRequest(db.Model):
    __tablename__ = "leave_requests"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    leave_type = db.Column(db.String(30), default="casual")  # casual, medical, od
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending, approved, rejected
    reviewed_by = db.Column(db.String(36), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "student_id": self.student_id, "leave_type": self.leave_type,
                "from_date": str(self.from_date), "to_date": str(self.to_date),
                "reason": self.reason, "status": self.status}


class MeetingSlot(db.Model):
    __tablename__ = "meeting_slots"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    faculty_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    is_booked = db.Column(db.Boolean, default=False)
    booked_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    purpose = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "faculty_id": self.faculty_id,
                "date": str(self.date),
                "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
                "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
                "is_booked": self.is_booked, "purpose": self.purpose}


class Resource(db.Model):
    __tablename__ = "resources"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    file_url = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(20), default="pdf")
    subject_code = db.Column(db.String(20), nullable=True)
    subject_name = db.Column(db.String(200), nullable=True)
    uploaded_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    department = db.Column(db.String(100), nullable=True)
    semester = db.Column(db.Integer, nullable=True)
    download_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "title": self.title, "file_url": self.file_url,
                "file_type": self.file_type, "subject_code": self.subject_code,
                "uploaded_by": self.uploaded_by, "download_count": self.download_count}


# ── Admin Module ───────────────────────────────────────────────────

class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.String(36), nullable=True)
    old_values = db.Column(db.Text, nullable=True)
    new_values = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "user_id": self.user_id, "action": self.action,
                "entity_type": self.entity_type, "entity_id": self.entity_id,
                "created_at": self.created_at.isoformat() if self.created_at else None}

class FeeRecord(db.Model):
    __tablename__ = "fee_records"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    fee_type = db.Column(db.String(50), nullable=False)  # tuition, exam, hostel, transport
    amount = db.Column(db.Float, nullable=False)
    semester = db.Column(db.Integer, nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    paid_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), default="pending")  # pending, paid, overdue
    transaction_id = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "student_id": self.student_id, "fee_type": self.fee_type,
                "amount": self.amount, "due_date": str(self.due_date) if self.due_date else None,
                "status": self.status, "transaction_id": self.transaction_id}
