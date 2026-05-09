"""
Attendance Service
===================
Business logic for attendance operations including
bulk marking, QR generation, and Bunk-O-Meter.
"""

import secrets
import json
from datetime import datetime, timezone, timedelta, date
from typing import Optional, Dict, List, Tuple

from ..models.attendance import AttendanceStatus, AttendanceMethod
from ..models.user import UserRole
from ..repositories.attendance_repo import AttendanceRepository
from ..repositories.user_repo import UserRepository
from ..extensions import redis_client


class AttendanceService:
    """Service for attendance business logic."""

    def __init__(self):
        self.attendance_repo = AttendanceRepository()
        self.user_repo = UserRepository()

    # ── Create Attendance Session ──────────────────────────────────

    def create_session(self, faculty_id: str, data: dict) -> Tuple[Optional[Dict], Optional[str]]:
        """Create a new attendance session for a class."""
        try:
            session = self.attendance_repo.create(
                subject_code=data["subject_code"],
                subject_name=data["subject_name"],
                faculty_id=faculty_id,
                department=data["department"],
                semester=data["semester"],
                section=data["section"],
                period_number=data["period_number"],
                session_date=data.get("session_date", date.today()),
            )

            # Get total students in this class
            students = self.user_repo.get_students_by_class(
                data["department"], data["semester"], data["section"],
            )
            session.total_students = len(students)

            self.attendance_repo.commit()

            return session.to_dict(), None

        except Exception as e:
            self.attendance_repo.rollback()
            return None, f"Failed to create session: {str(e)}"

    # ── Bulk Attendance (Faculty One-Tap) ──────────────────────────

    def bulk_mark_attendance(self, session_id: str, faculty_id: str,
                              records: List[Dict]) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Mark attendance for multiple students at once.
        Faculty marks all present by default, then taps absentees.
        
        records format: [{"student_id": "...", "status": "present|absent|late"}]
        """
        session = self.attendance_repo.get_by_id(session_id)
        if not session:
            return None, "Attendance session not found"

        if session.faculty_id != faculty_id:
            return None, "Not authorized for this session"

        if session.is_finalized:
            return None, "Session is already finalized"

        try:
            present_count = 0
            absent_count = 0

            for record in records:
                status = AttendanceStatus(record.get("status", "present"))
                self.attendance_repo.bulk_create_records(
                    session_id=session_id,
                    student_ids=[record["student_id"]],
                    status=status,
                    method=AttendanceMethod.BULK,
                    marked_by=faculty_id,
                )
                if status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE):
                    present_count += 1
                else:
                    absent_count += 1

            # Update session totals
            session.total_present = present_count
            session.total_absent = absent_count
            self.attendance_repo.commit()

            # Invalidate cache
            self._invalidate_cache(session)

            return {
                "session_id": session_id,
                "total_marked": len(records),
                "present": present_count,
                "absent": absent_count,
            }, None

        except Exception as e:
            self.attendance_repo.rollback()
            return None, f"Bulk marking failed: {str(e)}"

    # ── QR Attendance ──────────────────────────────────────────────

    def generate_qr_token(self, session_id: str,
                           faculty_id: str, lat: Optional[float] = None, lng: Optional[float] = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Generate a dynamic, time-locked QR token for a session.
        Token expires in 60s. Includes faculty GPS for geofencing.
        """
        session = self.attendance_repo.get_by_id(session_id)
        if not session:
            return None, "Session not found"

        if session.faculty_id != faculty_id:
            return None, "Not authorized"

        # Generate cryptographically secure token
        qr_token = secrets.token_urlsafe(32)
        expiry_seconds = 60  # Reduced to 60 seconds

        session.qr_token = qr_token
        session.qr_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expiry_seconds)

        # Store in Redis for fast validation
        try:
            redis_client.setex(
                f"qr:{qr_token}",
                expiry_seconds,
                json.dumps({
                    "session_id": session_id,
                    "faculty_id": faculty_id,
                    "subject": session.subject_code,
                    "lat": lat,
                    "lng": lng,
                }),
            )
        except Exception:
            pass  # Graceful degradation if Redis is down

        self.attendance_repo.commit()

        return {
            "qr_token": qr_token,
            "expires_at": session.qr_expires_at.isoformat(),
            "validity_seconds": expiry_seconds,
            "session_id": session_id,
        }, None

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance in meters between two GPS coordinates."""
        import math
        R = 6371000  # radius of Earth in meters
        phi_1 = math.radians(lat1)
        phi_2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi_1) * math.cos(phi_2) * \
            math.sin(delta_lambda / 2.0) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def scan_qr_attendance(self, qr_token: str,
                            student_id: str, student_lat: Optional[float] = None, student_lng: Optional[float] = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Student scans QR code to mark attendance.
        Validates token, checks expiry, and verifies GPS within 50 meters.
        """
        # Try Redis first (fast path)
        try:
            cached = redis_client.get(f"qr:{qr_token}")
            if cached:
                qr_data = json.loads(cached)
                session_id = qr_data["session_id"]
                faculty_lat = qr_data.get("lat")
                faculty_lng = qr_data.get("lng")
                
                # GPS Validation
                if faculty_lat is not None and faculty_lng is not None and student_lat is not None and student_lng is not None:
                    dist = self._haversine_distance(faculty_lat, faculty_lng, student_lat, student_lng)
                    if dist > 50:
                        return None, f"You are {int(dist)}m away. Must be within 50 meters of the classroom."
            else:
                return None, "QR code has expired. Ask faculty for a new one."
        except Exception:
            # Fallback to DB (doesn't have GPS stored right now, so relies on Redis for geofencing)
            session = self.attendance_repo.get_session_by_qr(qr_token)
            if not session:
                return None, "Invalid QR code"
            if session.qr_expires_at and session.qr_expires_at < datetime.now(timezone.utc):
                return None, "QR code has expired"
            session_id = session.id

        # Mark attendance
        try:
            records = self.attendance_repo.bulk_create_records(
                session_id=session_id,
                student_ids=[student_id],
                status=AttendanceStatus.PRESENT,
                method=AttendanceMethod.QR_SCAN,
            )
            self.attendance_repo.commit()

            return {
                "status": "present",
                "method": "qr_scan",
                "session_id": session_id,
                "marked_at": datetime.now(timezone.utc).isoformat(),
            }, None

        except Exception as e:
            self.attendance_repo.rollback()
            return None, f"QR scan failed: {str(e)}"

    # ── Offline Sync ───────────────────────────────────────────────

    def sync_offline_attendance(self, records: List[Dict]) -> Dict:
        """
        Sync attendance records that were captured offline.
        Each record includes a client_timestamp for audit.
        """
        synced = 0
        failed = 0
        errors = []

        for record in records:
            try:
                self.attendance_repo.bulk_create_records(
                    session_id=record["session_id"],
                    student_ids=[record["student_id"]],
                    status=AttendanceStatus(record.get("status", "present")),
                    method=AttendanceMethod.OFFLINE_SYNC,
                )
                synced += 1
            except Exception as e:
                failed += 1
                errors.append({"record": record, "error": str(e)})

        if synced > 0:
            self.attendance_repo.commit()

        return {
            "synced": synced,
            "failed": failed,
            "errors": errors,
            "synced_at": datetime.now(timezone.utc).isoformat(),
        }

    # ── Bunk-O-Meter ───────────────────────────────────────────────

    def get_bunk_o_meter(self, student_id: str,
                          subject_code: Optional[str] = None) -> Dict:
        """Get attendance summary with bunkable calculation."""
        if subject_code:
            return self.attendance_repo.get_student_attendance_summary(
                student_id, subject_code,
            )
        return {
            "subjects": self.attendance_repo.get_subject_wise_summary(student_id),
        }

    # ── Faculty Dashboard ──────────────────────────────────────────

    def get_faculty_sessions(self, faculty_id: str,
                              session_date: Optional[date] = None) -> List[Dict]:
        """Get all attendance sessions for a faculty member."""
        sessions = self.attendance_repo.get_sessions_by_faculty(
            faculty_id, session_date,
        )
        return [s.to_dict() for s in sessions]

    # ── Cache Management ───────────────────────────────────────────

    def _invalidate_cache(self, session):
        """Invalidate Redis cache when attendance changes."""
        try:
            # Invalidate class-level cache
            key = f"attendance:{session.department}:{session.semester}:{session.section}"
            redis_client.delete(key)
        except Exception:
            pass
