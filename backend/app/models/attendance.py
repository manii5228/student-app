"""
Attendance Model
=================
Supports bulk marking, QR-based check-in, and per-student tracking.
Includes the "Bunk-O-Meter" calculation logic.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Index

from ..extensions import db


class AttendanceStatus(PyEnum):
    """Attendance marking options."""
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    ON_DUTY = "on_duty"
    LEAVE = "leave"


class AttendanceMethod(PyEnum):
    """How the attendance was captured."""
    MANUAL = "manual"           # Faculty marked manually
    QR_SCAN = "qr_scan"         # Student scanned QR code
    BULK = "bulk"               # Faculty used bulk-mark
    OFFLINE_SYNC = "offline"    # Synced from offline cache


class Attendance(db.Model):
    """
    An attendance session created by faculty for a specific class.
    Students are marked against this session.
    """
    __tablename__ = "attendance_sessions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_code = db.Column(db.String(20), nullable=False, index=True)
    subject_name = db.Column(db.String(200), nullable=False)
    faculty_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    # ── Session details ────────────────────────────────────────────
    department = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    section = db.Column(db.String(10), nullable=False)
    period_number = db.Column(db.Integer, nullable=False)  # 1-8
    session_date = db.Column(db.Date, nullable=False, index=True)

    # ── QR Code (for dynamic QR attendance) ────────────────────────
    qr_token = db.Column(db.String(64), nullable=True, unique=True)
    qr_expires_at = db.Column(db.DateTime, nullable=True)

    # ── Metadata ───────────────────────────────────────────────────
    is_finalized = db.Column(db.Boolean, default=False)
    total_present = db.Column(db.Integer, default=0)
    total_absent = db.Column(db.Integer, default=0)
    total_students = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ──────────────────────────────────────────────
    faculty = db.relationship("User", backref="attendance_sessions", foreign_keys=[faculty_id])
    records = db.relationship("AttendanceRecord", backref="session", lazy="dynamic",
                              cascade="all, delete-orphan")

    # ── Indexes ────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_attendance_subject_date", "subject_code", "session_date"),
        Index("ix_attendance_dept_sem", "department", "semester", "section"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "subject_code": self.subject_code,
            "subject_name": self.subject_name,
            "faculty_id": self.faculty_id,
            "department": self.department,
            "semester": self.semester,
            "section": self.section,
            "period_number": self.period_number,
            "session_date": self.session_date.isoformat() if self.session_date else None,
            "is_finalized": self.is_finalized,
            "total_present": self.total_present,
            "total_absent": self.total_absent,
            "total_students": self.total_students,
            "has_qr": self.qr_token is not None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Attendance {self.subject_code} {self.session_date}>"


class AttendanceRecord(db.Model):
    """
    Individual attendance record for a student in a session.
    Supports offline sync with timestamp tracking.
    """
    __tablename__ = "attendance_records"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(36), db.ForeignKey("attendance_sessions.id", ondelete="CASCADE"),
                           nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"),
                           nullable=False, index=True)

    # ── Status ─────────────────────────────────────────────────────
    status = db.Column(db.Enum(AttendanceStatus), nullable=False, default=AttendanceStatus.ABSENT)
    method = db.Column(db.Enum(AttendanceMethod), nullable=False, default=AttendanceMethod.MANUAL)

    # ── Timestamps ─────────────────────────────────────────────────
    marked_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    synced_at = db.Column(db.DateTime, nullable=True)  # When offline data was synced
    client_timestamp = db.Column(db.DateTime, nullable=True)  # Original offline timestamp

    # ── Audit ──────────────────────────────────────────────────────
    marked_by = db.Column(db.String(36), nullable=True)  # Faculty who marked
    remarks = db.Column(db.String(300), nullable=True)

    # ── Indexes ────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_record_student_session", "student_id", "session_id", unique=True),
        Index("ix_record_status", "status"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "student_id": self.student_id,
            "status": self.status.value,
            "method": self.method.value,
            "marked_at": self.marked_at.isoformat() if self.marked_at else None,
            "remarks": self.remarks,
        }

    def __repr__(self):
        return f"<AttendanceRecord {self.student_id} → {self.status.value}>"
