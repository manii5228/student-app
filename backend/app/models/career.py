"""
Career & Placement Models, Faculty Module Models, Health/Utility Models
"""

import uuid
from datetime import datetime, timezone
from ..extensions import db


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
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "company_name": self.company_name,
                "question_text": self.question_text, "category": self.category, "year": self.year}


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


# ── Health & Utility ───────────────────────────────────────────────

class HealthAppointment(db.Model):
    __tablename__ = "health_appointments"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False)
    appointment_time = db.Column(db.Time, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    doctor_name = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(20), default="scheduled")
    prescription = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "student_id": self.student_id,
                "appointment_date": str(self.appointment_date),
                "appointment_time": self.appointment_time.strftime("%H:%M") if self.appointment_time else None,
                "reason": self.reason, "doctor_name": self.doctor_name, "status": self.status}


class EmergencyAlert(db.Model):
    __tablename__ = "emergency_alerts"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    alert_type = db.Column(db.String(30), default="sos")  # sos, medical, fire, security
    location_lat = db.Column(db.Float, nullable=True)
    location_lng = db.Column(db.Float, nullable=True)
    message = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default="active")
    resolved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "user_id": self.user_id, "alert_type": self.alert_type,
                "location_lat": self.location_lat, "location_lng": self.location_lng,
                "message": self.message, "status": self.status,
                "created_at": self.created_at.isoformat() if self.created_at else None}


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
