"""
Timetable Repository
=====================
Handles timetable and slot queries with conflict detection.
"""

from typing import Optional, List, Dict
from datetime import time

from .base import BaseRepository
from ..models.timetable import Timetable, TimetableSlot, DayOfWeek, SlotType
from ..extensions import db


class TimetableRepository(BaseRepository):
    """Repository for Timetable operations."""

    def __init__(self):
        super().__init__(Timetable)

    def get_active_timetable(self, department: str, semester: int,
                              section: str) -> Optional[Timetable]:
        """Get the currently active timetable for a class."""
        return Timetable.query.filter_by(
            department=department,
            semester=semester,
            section=section,
            is_active=True,
            is_published=True,
        ).first()

    def get_faculty_timetable(self, faculty_id: str) -> List[TimetableSlot]:
        """Get all slots assigned to a faculty member."""
        return TimetableSlot.query.filter_by(faculty_id=faculty_id)\
            .join(Timetable).filter(Timetable.is_active == True)\
            .order_by(TimetableSlot.day, TimetableSlot.period_number).all()

    def get_slots_by_day(self, timetable_id: str,
                          day: DayOfWeek) -> List[TimetableSlot]:
        """Get all slots for a specific day."""
        return TimetableSlot.query.filter_by(
            timetable_id=timetable_id, day=day,
        ).order_by(TimetableSlot.period_number).all()

    def create_slot(self, **kwargs) -> TimetableSlot:
        """Create a new timetable slot with conflict check."""
        slot = TimetableSlot(**kwargs)
        db.session.add(slot)
        db.session.flush()
        return slot

    def check_conflicts(self, timetable_id: str, day: DayOfWeek,
                         period_number: int,
                         faculty_id: Optional[str] = None,
                         room_number: Optional[str] = None,
                         exclude_slot_id: Optional[str] = None) -> List[Dict]:
        """
        Check for scheduling conflicts:
        1. Same room, same day/period (room conflict)
        2. Same faculty, same day/period (faculty conflict)
        """
        conflicts = []

        # ── Room Conflict ──────────────────────────────────────────
        if room_number:
            room_query = TimetableSlot.query.join(Timetable).filter(
                Timetable.is_active == True,
                TimetableSlot.room_number == room_number,
                TimetableSlot.day == day,
                TimetableSlot.period_number == period_number,
            )
            if exclude_slot_id:
                room_query = room_query.filter(TimetableSlot.id != exclude_slot_id)

            for slot in room_query.all():
                conflicts.append({
                    "type": "room",
                    "message": f"Room {room_number} is already booked for "
                               f"{slot.subject_name} on {day.value} P{period_number}",
                    "conflicting_slot": slot.to_dict(),
                })

        # ── Faculty Conflict ───────────────────────────────────────
        if faculty_id:
            faculty_query = TimetableSlot.query.join(Timetable).filter(
                Timetable.is_active == True,
                TimetableSlot.faculty_id == faculty_id,
                TimetableSlot.day == day,
                TimetableSlot.period_number == period_number,
            )
            if exclude_slot_id:
                faculty_query = faculty_query.filter(TimetableSlot.id != exclude_slot_id)

            for slot in faculty_query.all():
                conflicts.append({
                    "type": "faculty",
                    "message": f"Faculty is already assigned to "
                               f"{slot.subject_name} on {day.value} P{period_number}",
                    "conflicting_slot": slot.to_dict(),
                })

        return conflicts

    def get_full_timetable_grid(self, timetable_id: str) -> Dict:
        """
        Build the full weekly timetable as a grid.
        Returns a dict with days as keys and sorted slots as values.
        """
        slots = TimetableSlot.query.filter_by(timetable_id=timetable_id)\
            .order_by(TimetableSlot.period_number).all()

        grid = {day.value: [] for day in DayOfWeek}
        for slot in slots:
            grid[slot.day.value].append(slot.to_dict())

        return grid
