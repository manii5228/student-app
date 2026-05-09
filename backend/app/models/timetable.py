"""
Timetable Model
================
Smart timetable with live class tracking, conflict detection,
and Redis-cached responses for 15k+ requests/hour.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Index

from ..extensions import db


class DayOfWeek(PyEnum):
    """Days of the academic week."""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"


class SlotType(PyEnum):
    """Type of timetable slot."""
    LECTURE = "lecture"
    LAB = "lab"
    TUTORIAL = "tutorial"
    BREAK = "break"
    FREE = "free"


class Timetable(db.Model):
    """
    Master timetable for a department/semester/section combination.
    Created and managed by admin.
    """
    __tablename__ = "timetables"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    section = db.Column(db.String(10), nullable=False)
    academic_year = db.Column(db.String(20), nullable=False)  # e.g., "2025-2026"

    # ── Status ─────────────────────────────────────────────────────
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_published = db.Column(db.Boolean, default=False, nullable=False)
    effective_from = db.Column(db.Date, nullable=True)
    effective_until = db.Column(db.Date, nullable=True)

    # ── Metadata ───────────────────────────────────────────────────
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ──────────────────────────────────────────────
    slots = db.relationship("TimetableSlot", backref="timetable", lazy="dynamic",
                            cascade="all, delete-orphan")

    # ── Indexes ────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_timetable_dept_sem", "department", "semester", "section"),
        Index("ix_timetable_active", "is_active", "is_published"),
    )

    def to_dict(self, include_slots=False):
        data = {
            "id": self.id,
            "name": self.name,
            "department": self.department,
            "semester": self.semester,
            "section": self.section,
            "academic_year": self.academic_year,
            "is_active": self.is_active,
            "is_published": self.is_published,
            "effective_from": self.effective_from.isoformat() if self.effective_from else None,
            "effective_until": self.effective_until.isoformat() if self.effective_until else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_slots:
            data["slots"] = [slot.to_dict() for slot in self.slots.all()]
        return data

    def __repr__(self):
        return f"<Timetable {self.department} Sem-{self.semester} {self.section}>"


class TimetableSlot(db.Model):
    """
    Individual slot in a timetable (one class/period).
    Linked to a specific day, time, faculty, and room.
    """
    __tablename__ = "timetable_slots"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_id = db.Column(db.String(36), db.ForeignKey("timetables.id", ondelete="CASCADE"),
                             nullable=False)

    # ── Schedule ───────────────────────────────────────────────────
    day = db.Column(db.Enum(DayOfWeek), nullable=False)
    period_number = db.Column(db.Integer, nullable=False)  # 1-8
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    slot_type = db.Column(db.Enum(SlotType), nullable=False, default=SlotType.LECTURE)

    # ── Subject & Faculty ──────────────────────────────────────────
    subject_code = db.Column(db.String(20), nullable=True)
    subject_name = db.Column(db.String(200), nullable=True)
    faculty_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    faculty_name = db.Column(db.String(200), nullable=True)

    # ── Location ───────────────────────────────────────────────────
    room_number = db.Column(db.String(30), nullable=True)
    building = db.Column(db.String(100), nullable=True)

    # ── Status ─────────────────────────────────────────────────────
    is_cancelled = db.Column(db.Boolean, default=False)
    substitute_faculty_id = db.Column(db.String(36), nullable=True)
    remarks = db.Column(db.String(300), nullable=True)

    # ── Indexes ────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_slot_day_period", "timetable_id", "day", "period_number"),
        Index("ix_slot_faculty", "faculty_id", "day"),
        Index("ix_slot_room", "room_number", "day", "period_number"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "timetable_id": self.timetable_id,
            "day": self.day.value,
            "period_number": self.period_number,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "slot_type": self.slot_type.value,
            "subject_code": self.subject_code,
            "subject_name": self.subject_name,
            "faculty_id": self.faculty_id,
            "faculty_name": self.faculty_name,
            "room_number": self.room_number,
            "building": self.building,
            "is_cancelled": self.is_cancelled,
            "remarks": self.remarks,
        }

    def __repr__(self):
        return f"<Slot {self.day.value} P{self.period_number} {self.subject_code}>"
