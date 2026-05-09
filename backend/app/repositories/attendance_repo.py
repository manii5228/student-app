"""
Attendance Repository
======================
Handles attendance session and record queries.
Includes Bunk-O-Meter calculations and bulk operations.
"""

from typing import Optional, List, Dict
from datetime import date, datetime, timezone

from sqlalchemy import func

from .base import BaseRepository
from ..models.attendance import (
    Attendance, AttendanceRecord, AttendanceStatus, AttendanceMethod,
)
from ..extensions import db


class AttendanceRepository(BaseRepository):
    """Repository for Attendance session operations."""

    def __init__(self):
        super().__init__(Attendance)

    def get_sessions_by_faculty(self, faculty_id: str,
                                 session_date: Optional[date] = None) -> List[Attendance]:
        """Get attendance sessions created by a faculty member."""
        query = Attendance.query.filter_by(faculty_id=faculty_id)
        if session_date:
            query = query.filter_by(session_date=session_date)
        return query.order_by(Attendance.session_date.desc(),
                              Attendance.period_number).all()

    def get_sessions_by_class(self, department: str, semester: int,
                               section: str,
                               start_date: Optional[date] = None,
                               end_date: Optional[date] = None) -> List[Attendance]:
        """Get attendance sessions for a specific class."""
        query = Attendance.query.filter_by(
            department=department, semester=semester, section=section,
        )
        if start_date:
            query = query.filter(Attendance.session_date >= start_date)
        if end_date:
            query = query.filter(Attendance.session_date <= end_date)
        return query.order_by(Attendance.session_date.desc()).all()

    def get_session_by_qr(self, qr_token: str) -> Optional[Attendance]:
        """Find an attendance session by its QR token."""
        return self.find_one_by(qr_token=qr_token)

    def bulk_create_records(self, session_id: str, student_ids: List[str],
                             status: AttendanceStatus = AttendanceStatus.PRESENT,
                             method: AttendanceMethod = AttendanceMethod.BULK,
                             marked_by: str = None) -> List[AttendanceRecord]:
        """Create attendance records for multiple students at once."""
        records = []
        for sid in student_ids:
            record = AttendanceRecord(
                session_id=session_id,
                student_id=sid,
                status=status,
                method=method,
                marked_by=marked_by,
                marked_at=datetime.now(timezone.utc),
            )
            db.session.add(record)
            records.append(record)
        db.session.flush()
        return records

    def update_record_status(self, session_id: str, student_id: str,
                              status: AttendanceStatus,
                              marked_by: str = None) -> Optional[AttendanceRecord]:
        """Update a student's attendance status in a session."""
        record = AttendanceRecord.query.filter_by(
            session_id=session_id, student_id=student_id,
        ).first()
        if record:
            record.status = status
            record.marked_by = marked_by
            record.marked_at = datetime.now(timezone.utc)
            db.session.flush()
        return record

    # ── Bunk-O-Meter Calculations ──────────────────────────────────

    def get_student_attendance_summary(self, student_id: str,
                                        subject_code: Optional[str] = None) -> Dict:
        """
        Calculate attendance percentage for a student.
        This is the core of the 'Bunk-O-Meter' feature.
        """
        query = db.session.query(
            AttendanceRecord.status,
            func.count(AttendanceRecord.id).label("count"),
        ).join(Attendance).filter(
            AttendanceRecord.student_id == student_id,
        )

        if subject_code:
            query = query.filter(Attendance.subject_code == subject_code)

        query = query.group_by(AttendanceRecord.status)
        results = query.all()

        summary = {s.value: 0 for s in AttendanceStatus}
        total = 0
        for status, count in results:
            summary[status.value] = count
            total += count

        present_count = summary["present"] + summary["late"] + summary["on_duty"]
        percentage = (present_count / total * 100) if total > 0 else 0.0

        return {
            "student_id": student_id,
            "subject_code": subject_code,
            "total_classes": total,
            "present": summary["present"],
            "absent": summary["absent"],
            "late": summary["late"],
            "on_duty": summary["on_duty"],
            "leave": summary["leave"],
            "percentage": round(percentage, 2),
            "can_bunk": self._calculate_bunkable(total, present_count),
        }

    def get_subject_wise_summary(self, student_id: str) -> List[Dict]:
        """Get attendance summary per subject for a student."""
        subjects = db.session.query(
            Attendance.subject_code,
            Attendance.subject_name,
        ).join(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
        ).distinct().all()

        summaries = []
        for code, name in subjects:
            s = self.get_student_attendance_summary(student_id, code)
            s["subject_name"] = name
            summaries.append(s)

        return summaries

    @staticmethod
    def _calculate_bunkable(total: int, present: int, min_pct: float = 75.0) -> int:
        """
        Calculate how many more classes a student can miss
        while staying above the minimum attendance percentage.
        """
        if total == 0:
            return 0
        # Formula: (present - min_pct/100 * (total + x)) >= 0
        # Solving for x: x <= (present / (min_pct/100)) - total
        bunkable = int(present / (min_pct / 100)) - total
        return max(0, bunkable)
