"""
User Model
===========
Supports three roles: Student, Faculty, Admin.
Includes password hashing, session tracking, and profile fields.
"""

import json
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Index
from werkzeug.security import generate_password_hash, check_password_hash

from ..extensions import db


class UserRole(PyEnum):
    """Role-Based Access Control — four tiers."""
    STUDENT = "student"
    FACULTY = "faculty"
    ADMIN = "admin"
    GUEST = "guest"


class User(db.Model):
    """
    Core user model for the Super-App.
    Shared across students, faculty, and admins with role differentiation.
    """
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(512), nullable=True)  # nullable for guest accounts
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.STUDENT)

    # ── Profile ────────────────────────────────────────────────────
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)

    # ── Custom profile extensions (Phase 12) ────────────────────────
    preferences = db.Column(db.Text, nullable=True, default='{}')
    achievements = db.Column(db.Text, nullable=True, default='[]')
    skills = db.Column(db.Text, nullable=True, default='[]')

    # ── Student-specific fields ────────────────────────────────────
    roll_number = db.Column(db.String(30), unique=True, nullable=True, index=True)
    department = db.Column(db.String(100), nullable=True)
    semester = db.Column(db.Integer, nullable=True)
    section = db.Column(db.String(10), nullable=True)
    batch_year = db.Column(db.Integer, nullable=True)
    cgpa = db.Column(db.Float, nullable=True, default=0.0)

    # ── Faculty-specific fields ────────────────────────────────────
    employee_id = db.Column(db.String(30), unique=True, nullable=True)
    designation = db.Column(db.String(100), nullable=True)
    specialization = db.Column(db.String(200), nullable=True)
    publications = db.Column(db.Text, nullable=True)
    research_interests = db.Column(db.Text, nullable=True)
    office_hours = db.Column(db.String(200), nullable=True)
    office_location = db.Column(db.String(200), nullable=True)

    # ── Mentor Assignment ──────────────────────────────────────────
    mentor_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)

    # ── Account status ─────────────────────────────────────────────
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    last_password_change = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ──────────────────────────────────────────────
    sessions = db.relationship("UserSession", backref="user", lazy="dynamic",
                               cascade="all, delete-orphan")
    attendance_records = db.relationship("AttendanceRecord", backref="student",
                                         lazy="dynamic", foreign_keys="AttendanceRecord.student_id")

    # ── Indexes ────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_users_role_dept", "role", "department"),
        Index("ix_users_batch", "batch_year", "semester"),
    )

    # ── Password Methods ───────────────────────────────────────────
    def set_password(self, password):
        """Hash and store the password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify a password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def to_dict(self, include_sensitive=False):
        """Serialize user to dictionary."""
        data = {
            "id": self.id,
            "email": self.email,
            "role": self.role.value,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "phone": self.phone,
            "avatar_url": self.avatar_url,
            "department": self.department,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "preferences": json.loads(self.preferences) if self.preferences else {},
            "achievements": json.loads(self.achievements) if self.achievements else [],
            "skills": json.loads(self.skills) if self.skills else [],
        }

        if self.role == UserRole.STUDENT:
            data.update({
                "roll_number": self.roll_number,
                "semester": self.semester,
                "section": self.section,
                "batch_year": self.batch_year,
                "cgpa": self.cgpa,
            })
        elif self.role == UserRole.FACULTY:
            data.update({
                "employee_id": self.employee_id,
                "designation": self.designation,
                "specialization": self.specialization,
                "publications": self.publications,
                "research_interests": self.research_interests,
                "office_hours": self.office_hours,
                "office_location": self.office_location,
            })

        return data

    def __repr__(self):
        return f"<User {self.email} [{self.role.value}]>"


class UserSession(db.Model):
    """
    Active session tracking — allows users to view and kill sessions.
    Implements the 'Active Session Manager' feature.
    Tracks JWT_ID, Device_Type, IP_Address per the security spec.
    """
    __tablename__ = "user_sessions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    jti = db.Column(db.String(36), unique=True, nullable=False, index=True)  # JWT Token ID
    device_info = db.Column(db.String(300), nullable=True)       # Full User-Agent
    device_type = db.Column(db.String(30), nullable=True)        # mobile / desktop / tablet
    ip_address = db.Column(db.String(45), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "device_info": self.device_info,
            "device_type": self.device_type,
            "ip_address": self.ip_address,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }

    def __repr__(self):
        return f"<Session {self.id} user={self.user_id}>"


class BiometricCredential(db.Model):
    """
    WebAuthn credential storage.
    Stores the public key registered via the device's biometric hardware
    (fingerprint / FaceID) so the user can authenticate without a password
    in high-traffic zones like Canteen or Exam portal.
    """
    __tablename__ = "biometric_credentials"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    credential_id = db.Column(db.Text, unique=True, nullable=False)          # base64url-encoded
    public_key = db.Column(db.Text, nullable=False)                          # COSE public key
    sign_count = db.Column(db.Integer, default=0, nullable=False)            # replay protection
    device_name = db.Column(db.String(200), nullable=True)                   # "iPhone 15", etc.
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_used = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", backref=db.backref("biometric_credentials", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.id,
            "credential_id": self.credential_id[:20] + "...",  # truncated for security
            "device_name": self.device_name,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_used": self.last_used.isoformat() if self.last_used else None,
        }

    def __repr__(self):
        return f"<BiometricCredential user={self.user_id} device={self.device_name}>"


class GuestActivityLog(db.Model):
    """
    Lightweight anonymous tracking for Guest Mode usage.
    Tracks feature interaction without identifying personal user data.
    """
    __tablename__ = "guest_activity_logs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(36), nullable=False)  # anonymous transient session UUID
    feature_name = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "feature_name": self.feature_name,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }

    def __repr__(self):
        return f"<GuestActivityLog {self.feature_name} at {self.timestamp}>"


class BiometricAuditLog(db.Model):
    """
    Audit log for FIDO2 WebAuthn biometric enrollment and verification.
    """
    __tablename__ = "biometric_audit_logs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    action = db.Column(db.String(50), nullable=False)  # e.g. "enroll_start", "enroll_success", "auth_success", "auth_failure"
    details = db.Column(db.Text, nullable=True)        # detailed failure reason or success metadata
    ip_address = db.Column(db.String(45), nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = db.relationship("User", backref=db.backref("biometric_audit_logs", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "action": self.action,
            "details": self.details,
            "ip_address": self.ip_address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }

    def __repr__(self):
        return f"<BiometricAuditLog {self.action} for user={self.user_id}>"

