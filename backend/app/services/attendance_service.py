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

from ..models.attendance import AttendanceStatus, AttendanceMethod, Attendance, AttendanceRecord, AttendanceDiscrepancy
from ..models.user import User, UserRole
from ..repositories.attendance_repo import AttendanceRepository
from ..repositories.user_repo import UserRepository
from ..extensions import db, redis_client


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

    def get_attendance_trends(self, student_id: str) -> Dict:
        """Calculate cumulative attendance trends over time for line charts."""
        records = AttendanceRecord.query.filter_by(student_id=student_id)\
            .join(Attendance)\
            .order_by(Attendance.session_date.asc(), Attendance.period_number.asc())\
            .all()
        
        overall_trend = []
        subject_trends = {} # subject_code -> list of trends
        
        total_so_far = 0
        present_so_far = 0
        
        subject_counts = {} # subject_code -> (total, present)
        
        for r in records:
            session = r.session
            if not session:
                continue
            
            # Overall percentage calculation
            total_so_far += 1
            if r.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ON_DUTY):
                present_so_far += 1
            
            overall_pct = (present_so_far / total_so_far) * 100
            overall_trend.append({
                "date": session.session_date.isoformat(),
                "percentage": round(overall_pct, 1),
                "subject": session.subject_code
            })
            
            # Subject-specific percentage calculation
            sub_code = session.subject_code
            if sub_code not in subject_counts:
                subject_counts[sub_code] = {"total": 0, "present": 0}
                subject_trends[sub_code] = []
                
            subject_counts[sub_code]["total"] += 1
            if r.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ON_DUTY):
                subject_counts[sub_code]["present"] += 1
                
            sub_pct = (subject_counts[sub_code]["present"] / subject_counts[sub_code]["total"]) * 100
            subject_trends[sub_code].append({
                "date": session.session_date.isoformat(),
                "percentage": round(sub_pct, 1)
            })
            
        return {
            "overall": overall_trend,
            "subjects": subject_trends
        }

    def get_student_records(self, student_id: str, subject_code: Optional[str] = None) -> List[Dict]:
        """Fetch all attendance records for a student, optionally filtered by subject."""
        query = AttendanceRecord.query.filter_by(student_id=student_id).join(Attendance)
        if subject_code:
            query = query.filter(Attendance.subject_code == subject_code)
        
        records = query.order_by(Attendance.session_date.desc(), Attendance.period_number.desc()).all()
        
        result = []
        for r in records:
            r_dict = r.to_dict()
            if r.session:
                r_dict["session"] = {
                    "subject_code": r.session.subject_code,
                    "subject_name": r.session.subject_name,
                    "session_date": r.session.session_date.isoformat(),
                    "period_number": r.session.period_number,
                }
            result.append(r_dict)
        return result

    def report_discrepancy(self, student_id: str, record_id: str, reason: str) -> Tuple[Optional[Dict], Optional[str]]:
        """Allow a student to report a discrepancy in their attendance record."""
        record = AttendanceRecord.query.get(record_id)
        if not record:
            return None, "Attendance record not found"
            
        if record.student_id != student_id:
            return None, "Not authorized to dispute this record"
            
        # Check if already reported
        existing = AttendanceDiscrepancy.query.filter_by(record_id=record_id).first()
        if existing:
            return None, "Discrepancy has already been reported for this record"
            
        try:
            discrepancy = AttendanceDiscrepancy(
                record_id=record_id,
                student_id=student_id,
                reason=reason,
                status="pending"
            )
            record.discrepancy_reported = True
            db.session.add(discrepancy)
            db.session.commit()
            return discrepancy.to_dict(), None
        except Exception as e:
            db.session.rollback()
            return None, f"Failed to report discrepancy: {str(e)}"

    def get_discrepancies(self, user_id: str, role: str, status: Optional[str] = None) -> List[Dict]:
        """Fetch attendance discrepancies based on user role and filters."""
        query = AttendanceDiscrepancy.query
        
        if role == "student":
            query = query.filter_by(student_id=user_id)
        elif role == "faculty":
            # Filter discrepancies for sessions taught by this faculty member
            query = query.join(AttendanceRecord).join(Attendance).filter(Attendance.faculty_id == user_id)
            
        if status:
            query = query.filter_by(status=status)
            
        discrepancies = query.order_by(AttendanceDiscrepancy.created_at.desc()).all()
        
        # Build enriched response
        result = []
        for d in discrepancies:
            d_dict = d.to_dict()
            record = d.record
            if record and record.session:
                d_dict["session"] = {
                    "subject_code": record.session.subject_code,
                    "subject_name": record.session.subject_name,
                    "session_date": record.session.session_date.isoformat(),
                    "period_number": record.session.period_number,
                }
                d_dict["current_status"] = record.status.value
            # Fetch student details
            student = d.student
            if student:
                d_dict["student"] = {
                    "full_name": student.full_name,
                    "roll_number": student.roll_number,
                    "email": student.email,
                }
            result.append(d_dict)
            
        return result

    def resolve_discrepancy(self, discrepancy_id: str, faculty_id: str, status: str, resolution_remarks: str, updated_status: Optional[str] = None) -> Tuple[Optional[Dict], Optional[str]]:
        """Allow faculty/admin to resolve or reject a student's discrepancy request."""
        discrepancy = AttendanceDiscrepancy.query.get(discrepancy_id)
        if not discrepancy:
            return None, "Discrepancy not found"
            
        record = discrepancy.record
        if not record or not record.session:
            return None, "Associated attendance record or session not found"
            
        # Faculty must be the one who taught or an admin
        if record.session.faculty_id != faculty_id:
            resolver_user = User.query.get(faculty_id)
            if not resolver_user or resolver_user.role.value != "admin":
                return None, "Not authorized to resolve this discrepancy"
                
        if discrepancy.status != "pending":
            return None, "Discrepancy is already resolved/rejected"
            
        try:
            discrepancy.status = status # resolved / rejected
            discrepancy.resolution_remarks = resolution_remarks
            discrepancy.resolved_by = faculty_id
            discrepancy.resolved_at = datetime.now(timezone.utc)
            
            if status == "resolved" and updated_status:
                record.status = AttendanceStatus(updated_status)
                
            record.discrepancy_reported = False
            db.session.commit()
            
            # Invalidate cache
            self._invalidate_cache(record.session)
            
            return discrepancy.to_dict(), None
        except Exception as e:
            db.session.rollback()
            return None, f"Failed to resolve discrepancy: {str(e)}"

    def run_attendance_alerts(self) -> Dict:
        """
        Cron job logic: Find students whose overall attendance drops below 75%
        and send mock email notifications to them and their mentors.
        Generates beautifully formatted HTML files in instance/outbox/.
        """
        import os
        from datetime import datetime, timezone
        
        students = User.query.filter_by(role=UserRole.STUDENT, is_active=True).all()
        alerts_sent = 0
        notifications = []
        
        log_dir = "instance/logs"
        outbox_dir = "instance/outbox"
        os.makedirs(log_dir, exist_ok=True)
        os.makedirs(outbox_dir, exist_ok=True)
        
        for student in students:
            summary = self.attendance_repo.get_student_attendance_summary(student.id)
            percentage = summary.get("percentage", 100.0)
            
            if percentage < 75.0 and summary.get("total_classes", 0) > 0:
                mentor = User.query.get(student.mentor_id) if student.mentor_id else None
                mentor_email = mentor.email if mentor else "mentor-unassigned@veltech.edu.in"
                mentor_name = mentor.full_name if mentor else "Unassigned Mentor"
                
                # Retrieve detailed subject-wise summaries for this student
                sub_summaries = self.attendance_repo.get_subject_wise_summary(student.id)
                
                # Build subject rows for the email HTML table
                table_rows = ""
                for sub in sub_summaries:
                    sub_pct = sub.get("percentage", 0.0)
                    is_low = sub_pct < 75.0
                    style = "color: #a91f23; font-weight: bold;" if is_low else "color: #22346c;"
                    row_bg = "background-color: #fdf2f2;" if is_low else "background-color: #ffffff;"
                    
                    table_rows += f"""
                    <tr style="{row_bg} border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px; font-size: 14px; color: #1e293b;">{sub.get('subject_code')}</td>
                        <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 500;">{sub.get('subject_name')}</td>
                        <td style="padding: 12px; font-size: 14px; color: #475569; text-align: center;">{sub.get('total_classes')}</td>
                        <td style="padding: 12px; font-size: 14px; color: #475569; text-align: center;">{sub.get('present') + sub.get('late') + sub.get('on_duty')}</td>
                        <td style="padding: 12px; font-size: 14px; text-align: right; {style}">{sub_pct}%</td>
                    </tr>
                    """
                
                timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
                file_name = f"warning_{student.roll_number}_{timestamp_str}.html"
                file_path = os.path.join(outbox_dir, file_name)
                
                # Write a beautifully styled HTML email output
                html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Urgent: Attendance Deficit Warning</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #a91f23 0%, #22346c 100%); padding: 40px 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">VELTECH UNIVERSITY</h1>
                <p style="color: #cbd5e1; margin: 8px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Office of Academic Affairs</p>
            </td>
        </tr>
        
        <!-- Content -->
        <tr>
            <td style="padding: 32px;">
                <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">Attendance Warning Notification</h2>
                
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    Dear <strong>{student.full_name}</strong> (Roll Number: <code>{student.roll_number}</code>),
                </p>
                
                <!-- Danger Alert Box -->
                <div style="background-color: #fef2f2; border-left: 4px solid #a91f23; padding: 18px; border-radius: 12px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.6; font-weight: 600;">
                        ⚠️ WARNING: Your overall attendance has dropped to <span style="font-size: 16px; font-weight: 800;">{percentage}%</span>, which is below the mandatory university threshold of <strong>75.0%</strong>. Failure to bring this average up will result in debarment from the final semester examinations.
                    </p>
                </div>
                
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                    Below is your course-wise attendance summary:
                </p>
                
                <!-- Subjects Table -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 28px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <thead>
                        <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                            <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Code</th>
                            <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Course Name</th>
                            <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Total</th>
                            <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Present</th>
                            <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table_rows}
                    </tbody>
                </table>
                
                <!-- Mentors Box -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 28px;">
                    <h3 style="color: #1e293b; margin: 0 0 12px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Mentor Contact Details</h3>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td style="font-size: 14px; color: #475569; padding-bottom: 8px; width: 100px;">Name:</td>
                            <td style="font-size: 14px; color: #1e293b; font-weight: 600; padding-bottom: 8px;">{mentor_name}</td>
                        </tr>
                        <tr>
                            <td style="font-size: 14px; color: #475569; width: 100px;">Email:</td>
                            <td style="font-size: 14px; color: #1e293b; font-weight: 600;"><a href="mailto:{mentor_email}" style="color: #0080c7; text-decoration: none;">{mentor_email}</a></td>
                        </tr>
                    </table>
                </div>
                
                <h3 style="color: #0f172a; margin: 0 0 12px 0; font-size: 15px; font-weight: 700;">Mandatory Steps:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.6;">
                    <li style="margin-bottom: 8px;">Schedule an appointment with your mentor, {mentor_name}, immediately.</li>
                    <li style="margin-bottom: 8px;">Ensure full attendance in all upcoming lectures.</li>
                    <li style="margin-bottom: 8px;">Submit official medical certificates or On-Duty letters if you missed classes due to approved college events or medical emergencies.</li>
                    <li style="margin-bottom: 8px;">Use the Super-App to flag any marked errors under the Attendance History & Dispute tab.</li>
                </ol>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 0; font-size: 12px;">This is an automated academic warning from VelTech University Super-App.</p>
                <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 11px;">Do not reply to this mailbox.</p>
            </td>
        </tr>
    </table>
</body>
</html>
"""
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(html_content)
                
                alert_msg = (
                    f"[ATTENDANCE ALERT] Student {student.full_name} ({student.roll_number}) "
                    f"attendance is {percentage}% (below 75%). "
                    f"Saved email warning letter to {file_name} for student and mentor {mentor_name}."
                )
                print(alert_msg)
                
                with open(os.path.join(log_dir, "attendance_alerts.log"), "a", encoding="utf-8") as f:
                    f.write(f"[{datetime.now(timezone.utc).isoformat()}] {alert_msg}\n")
                    
                notifications.append({
                    "student_email": student.email,
                    "student_name": student.full_name,
                    "percentage": percentage,
                    "mentor_email": mentor_email,
                    "mentor_name": mentor_name,
                    "html_file": file_name,
                })
                alerts_sent += 1
                
        return {
            "alerts_sent": alerts_sent,
            "notifications": notifications
        }


    # ── Cache Management ───────────────────────────────────────────

    def _invalidate_cache(self, session):
        """Invalidate Redis cache when attendance changes."""
        try:
            # Invalidate class-level cache
            key = f"attendance:{session.department}:{session.semester}:{session.section}"
            redis_client.delete(key)
        except Exception:
            pass
