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
