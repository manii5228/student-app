"""Repositories package — Database abstraction layer (Repository Pattern)."""

from .base import BaseRepository
from .user_repo import UserRepository
from .attendance_repo import AttendanceRepository
from .timetable_repo import TimetableRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "AttendanceRepository",
    "TimetableRepository",
]
