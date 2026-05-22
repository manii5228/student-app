"""
Attendance & Timetable Tests
"""

import pytest


class TestAttendanceSession:
    def test_create_session(self, client, faculty_headers):
        resp = client.post("/api/v1/attendance/session", headers=faculty_headers, json={
            "subject_code": "CS301",
            "subject_name": "Data Structures",
            "department": "CSE",
            "semester": 3,
            "section": "A",
            "period_number": 1,
        })
        assert resp.status_code == 201

    def test_student_cannot_create_session(self, client, auth_headers):
        resp = client.post("/api/v1/attendance/session", headers=auth_headers, json={
            "subject_code": "CS301",
            "subject_name": "DS",
            "department": "CSE",
            "semester": 3,
            "section": "A",
            "period_number": 1,
        })
        assert resp.status_code == 403


class TestBunkOMeter:
    def test_bunk_o_meter(self, client, auth_headers):
        resp = client.get("/api/v1/attendance/bunk-o-meter", headers=auth_headers)
        assert resp.status_code == 200


class TestTimetable:
    def test_create_timetable_admin(self, client, admin_headers):
        resp = client.post("/api/v1/timetable/", headers=admin_headers, json={
            "name": "CSE Sem-3 A",
            "department": "CSE",
            "semester": 3,
            "section": "A",
            "academic_year": "2025-2026",
        })
        assert resp.status_code == 201

    def test_student_cannot_create_timetable(self, client, auth_headers):
        resp = client.post("/api/v1/timetable/", headers=auth_headers, json={
            "name": "Test", "department": "CSE",
            "semester": 3, "section": "A", "academic_year": "2025-2026",
        })
        assert resp.status_code == 403


class TestDiscrepancyAndTrends:
    def test_attendance_trends(self, client, auth_headers):
        resp = client.get("/api/v1/attendance/trends", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert "overall" in data
        assert "subjects" in data

    def test_report_and_resolve_discrepancy(self, client, auth_headers, faculty_headers):
        # 1. Create a session
        resp_session = client.post("/api/v1/attendance/session", headers=faculty_headers, json={
            "subject_code": "CS301",
            "subject_name": "Data Structures",
            "department": "CSE",
            "semester": 4,
            "section": "A",
            "period_number": 1,
        })
        assert resp_session.status_code == 201
        session_id = resp_session.get_json()["session"]["id"]

        # 2. Get students for class
        resp_students = client.get(f"/api/v1/attendance/students?department=CSE&semester=4&section=A", headers=faculty_headers)
        assert resp_students.status_code == 200
        student_id = resp_students.get_json()["students"][0]["id"]

        # Mark attendance
        resp_mark = client.post(f"/api/v1/attendance/session/{session_id}/bulk", headers=faculty_headers, json={
            "records": [{"student_id": student_id, "status": "absent"}]
        })
        assert resp_mark.status_code == 200

        # Retrieve student attendance record to dispute it
        from app.models.attendance import AttendanceRecord
        with client.application.app_context():
            record = AttendanceRecord.query.filter_by(student_id=student_id).first()
            assert record is not None
            record_id = record.id

        # 3. Report discrepancy
        resp_dispute = client.post("/api/v1/attendance/discrepancy", headers=auth_headers, json={
            "record_id": record_id,
            "reason": "I was present but marked absent."
        })
        assert resp_dispute.status_code == 201
        discrepancy_id = resp_dispute.get_json()["discrepancy"]["id"]

        # 4. List discrepancies as faculty
        resp_list = client.get("/api/v1/attendance/discrepancies", headers=faculty_headers)
        assert resp_list.status_code == 200
        discrepancies = resp_list.get_json()["discrepancies"]
        assert len(discrepancies) > 0

        # 5. Resolve discrepancy
        resp_resolve = client.post(f"/api/v1/attendance/discrepancy/{discrepancy_id}/resolve", headers=faculty_headers, json={
            "status": "resolved",
            "resolution_remarks": "Corrected database entry.",
            "updated_status": "present"
        })
        assert resp_resolve.status_code == 200

        # Verify record is present now
        with client.application.app_context():
            record = AttendanceRecord.query.get(record_id)
            from app.models.attendance import AttendanceStatus
            assert record.status == AttendanceStatus.PRESENT

    def test_my_records(self, client, auth_headers):
        resp = client.get("/api/v1/attendance/my-records", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert "records" in data
        assert isinstance(data["records"], list)
