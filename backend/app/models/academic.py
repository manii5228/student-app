"""
Academic Models
================
Credit tracking, Assignment submissions, Results/Gradebook,
Syllabus, Internal Marks, Exam Schedule.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from ..extensions import db


class AssignmentStatus(PyEnum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    GRADED = "graded"
    LATE = "late"
    RESUBMIT = "resubmit"


class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    subject_code = db.Column(db.String(20), nullable=False)
    subject_name = db.Column(db.String(200), nullable=False)
    faculty_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    section = db.Column(db.String(10), nullable=False)
    max_marks = db.Column(db.Float, default=100.0)
    due_date = db.Column(db.DateTime, nullable=False)
    allow_late = db.Column(db.Boolean, default=False)
    file_types_allowed = db.Column(db.String(200), default="pdf,jpg,png,docx")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    submissions = db.relationship("AssignmentSubmission", backref="assignment",
                                   lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id, "title": self.title, "description": self.description,
            "subject_code": self.subject_code, "subject_name": self.subject_name,
            "faculty_id": self.faculty_id, "department": self.department,
            "semester": self.semester, "section": self.section,
            "max_marks": self.max_marks,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "allow_late": self.allow_late, "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AssignmentSubmission(db.Model):
    __tablename__ = "assignment_submissions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = db.Column(db.String(36), db.ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    file_url = db.Column(db.String(500), nullable=True)       # S3 link
    file_name = db.Column(db.String(300), nullable=True)
    submission_hash = db.Column(db.String(64), unique=True, nullable=True)  # SHA-256 receipt
    status = db.Column(db.Enum(AssignmentStatus), default=AssignmentStatus.SUBMITTED)
    marks_obtained = db.Column(db.Float, nullable=True)
    faculty_comment = db.Column(db.Text, nullable=True)
    submitted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    graded_at = db.Column(db.DateTime, nullable=True)
    plagiarism_score = db.Column(db.Float, nullable=True)
    virus_scan_passed = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id, "assignment_id": self.assignment_id,
            "student_id": self.student_id, "file_url": self.file_url,
            "file_name": self.file_name,
            "submission_hash": self.submission_hash,
            "status": self.status.value, "marks_obtained": self.marks_obtained,
            "faculty_comment": self.faculty_comment,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "graded_at": self.graded_at.isoformat() if self.graded_at else None,
            "plagiarism_score": self.plagiarism_score,
            "virus_scan_passed": self.virus_scan_passed,
        }


class Result(db.Model):
    __tablename__ = "results"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    semester = db.Column(db.Integer, nullable=False)
    subject_code = db.Column(db.String(20), nullable=False)
    subject_name = db.Column(db.String(200), nullable=False)
    credits = db.Column(db.Integer, default=3)
    internal_marks = db.Column(db.Float, nullable=True)
    external_marks = db.Column(db.Float, nullable=True)
    total_marks = db.Column(db.Float, nullable=True)
    grade = db.Column(db.String(5), nullable=True)
    grade_points = db.Column(db.Float, nullable=True)
    sgpa = db.Column(db.Float, nullable=True)
    cgpa = db.Column(db.Float, nullable=True)
    exam_type = db.Column(db.String(30), default="regular")
    published = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    digital_signature = db.Column(db.String(512), nullable=True)
    hash_receipt = db.Column(db.String(64), nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "student_id": self.student_id,
            "semester": self.semester, "subject_code": self.subject_code,
            "subject_name": self.subject_name, "credits": self.credits,
            "internal_marks": self.internal_marks, "external_marks": self.external_marks,
            "total_marks": self.total_marks, "grade": self.grade,
            "grade_points": self.grade_points, "sgpa": self.sgpa, "cgpa": self.cgpa,
            "digital_signature": self.digital_signature,
            "hash_receipt": self.hash_receipt,
        }


class Syllabus(db.Model):
    __tablename__ = "syllabus"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_code = db.Column(db.String(20), nullable=False, index=True)
    subject_name = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    unit_number = db.Column(db.Integer, nullable=False)
    unit_title = db.Column(db.String(300), nullable=False)
    topics = db.Column(db.Text, nullable=True)
    hours = db.Column(db.Integer, default=10)
    is_completed = db.Column(db.Boolean, default=False)
    completed_by = db.Column(db.String(36), nullable=True)
    completed_topics = db.Column(db.Text, nullable=True)  # Comma-separated or JSON list of completed topics
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    academic_year = db.Column(db.String(20), default="2025-2026")
    version = db.Column(db.Integer, default=1)

    def to_dict(self):
        return {
            "id": self.id, "subject_code": self.subject_code,
            "subject_name": self.subject_name, "department": self.department,
            "semester": self.semester, "unit_number": self.unit_number,
            "unit_title": self.unit_title, "topics": self.topics,
            "hours": self.hours, "is_completed": self.is_completed,
            "academic_year": self.academic_year, "version": self.version,
            "completed_topics": self.completed_topics,
        }


class ExamSchedule(db.Model):
    __tablename__ = "exam_schedules"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_code = db.Column(db.String(20), nullable=False)
    subject_name = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    exam_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    room_number = db.Column(db.String(30), nullable=True)
    building = db.Column(db.String(100), nullable=True)
    exam_type = db.Column(db.String(30), default="end_semester")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id, "subject_code": self.subject_code,
            "subject_name": self.subject_name, "department": self.department,
            "semester": self.semester,
            "exam_date": self.exam_date.isoformat() if self.exam_date else None,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "room_number": self.room_number, "exam_type": self.exam_type,
        }


class CreditProgress(db.Model):
    __tablename__ = "credit_progress"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    total_required = db.Column(db.Integer, default=160)
    total_earned = db.Column(db.Integer, default=0)
    core_earned = db.Column(db.Integer, default=0)
    elective_earned = db.Column(db.Integer, default=0)
    lab_earned = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "student_id": self.student_id,
            "total_required": self.total_required, "total_earned": self.total_earned,
            "core_earned": self.core_earned, "elective_earned": self.elective_earned,
            "lab_earned": self.lab_earned,
            "percentage": round(self.total_earned / self.total_required * 100, 1) if self.total_required else 0,
        }


class InternalMark(db.Model):
    __tablename__ = "internal_marks"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    subject_code = db.Column(db.String(20), nullable=False)
    subject_name = db.Column(db.String(200), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    test_type = db.Column(db.String(30), nullable=False)  # cat1, cat2, model, lab
    max_marks = db.Column(db.Float, default=50.0)
    marks_obtained = db.Column(db.Float, nullable=True)
    faculty_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id, "student_id": self.student_id,
            "subject_code": self.subject_code, "subject_name": self.subject_name,
            "semester": self.semester, "test_type": self.test_type,
            "max_marks": self.max_marks, "marks_obtained": self.marks_obtained,
        }


class QuestionPaper(db.Model):
    """
    Previous Year Question Papers repository.
    Indexed by Subject_Code and Year for fast search.
    Files served via CDN (Cloudflare) for 15k concurrent downloads.
    """
    __tablename__ = "question_papers"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_code = db.Column(db.String(20), nullable=False, index=True)
    subject_name = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False, index=True)
    exam_type = db.Column(db.String(30), default="end_semester")   # cat1, cat2, end_semester
    file_url = db.Column(db.String(500), nullable=False)           # CDN / S3 link
    file_size_kb = db.Column(db.Integer, nullable=True)
    uploaded_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    download_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    ocr_content = db.Column(db.Text, nullable=True)

    __table_args__ = (
        db.Index("ix_qp_subject_year", "subject_code", "year"),
    )

    def to_dict(self):
        return {
            "id": self.id, "subject_code": self.subject_code,
            "subject_name": self.subject_name, "department": self.department,
            "semester": self.semester, "year": self.year,
            "exam_type": self.exam_type, "file_url": self.file_url,
            "download_count": self.download_count,
        }

