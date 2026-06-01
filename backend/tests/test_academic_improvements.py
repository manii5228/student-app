import io
import json
from datetime import datetime, date, time
from app.extensions import db
from app.models.academic import Assignment, Result, Syllabus, ExamSchedule, InternalMark, QuestionPaper
from app.models.timetable import Timetable, TimetableSlot, DayOfWeek, SlotType
from app.models.user import User, UserRole

def test_assignment_file_upload(client, auth_headers, faculty_headers):
    # 1. Create an assignment
    res = client.post("/api/v1/academic/assignments", headers=faculty_headers, json={
        "title": "Test Assignment",
        "description": "Upload test",
        "subject_code": "CS301",
        "subject_name": "Data Structures",
        "department": "CSE",
        "semester": 4,
        "section": "A",
        "max_marks": 100,
        "due_date": "2026-12-31T23:59:00",
        "allow_late": True
    })
    assert res.status_code == 201
    aid = res.get_json()["assignment"]["id"]

    # 2. Upload file
    data = {
        'file': (io.BytesIO(b"Assignment content. Nice and clean!"), 'test_sub.pdf')
    }
    res = client.post(f"/api/v1/academic/assignments/{aid}/upload", headers=auth_headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 201
    res_data = res.get_json()
    assert res_data["message"] == "File uploaded and processed successfully"
    assert res_data["submission"]["virus_scan_passed"] is True
    assert res_data["submission"]["plagiarism_score"] >= 0.0

    # 3. Test virus detection
    data_virus = {
        'file': (io.BytesIO(b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE content"), 'malware.pdf')
    }
    res_v = client.post(f"/api/v1/academic/assignments/{aid}/upload", headers=auth_headers, data=data_virus, content_type='multipart/form-data')
    assert res_v.status_code == 201
    assert res_v.get_json()["submission"]["virus_scan_passed"] is False


def test_results_analytics(client, auth_headers):
    # Login student to get user id
    res_user = client.get("/api/v1/auth/me", headers=auth_headers)
    student_id = res_user.get_json()["user"]["id"]

    # Create dummy results
    with client.application.app_context():
        other_user = User(
            id="other_student",
            email="other_student@veltech.edu.in",
            role=UserRole.STUDENT,
            first_name="Other",
            last_name="Student",
            department="CSE",
            semester=4,
            section="A",
            roll_number="22CSE888",
            is_verified=True
        )
        other_user.set_password("student123!")
        db.session.add(other_user)
        db.session.flush()

        res1 = Result(
            student_id=student_id, semester=4, subject_code="CS301", subject_name="Data Structures",
            total_marks=85.0, published=True
        )
        res2 = Result(
            student_id="other_student", semester=4, subject_code="CS301", subject_name="Data Structures",
            total_marks=75.0, published=True
        )
        db.session.add_all([res1, res2])
        db.session.commit()

    # Query analytics
    res = client.get("/api/v1/academic/results/analytics?semester=4", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["overall_percentile"] == 100.0 # 85 is greater than 75
    assert data["class_averages"]["CS301"] == 80.0
    assert data["signature_receipt"] is not None


def test_syllabus_version_filtering(client, auth_headers):
    with client.application.app_context():
        s1 = Syllabus(
            subject_code="CS301", subject_name="Data Structures", department="CSE", semester=4,
            unit_number=1, unit_title="Unit 1", topics="- Introduction", hours=10,
            academic_year="2025-2026", version=1
        )
        s2 = Syllabus(
            subject_code="CS301", subject_name="Data Structures", department="CSE", semester=4,
            unit_number=1, unit_title="Unit 1 Old", topics="- Intro old", hours=10,
            academic_year="2024-2025", version=2
        )
        db.session.add_all([s1, s2])
        db.session.commit()

    # Filter by year and version
    res = client.get("/api/v1/academic/syllabus?subject_code=CS301&academic_year=2025-2026&version=1", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["syllabus"]) == 1
    assert data["syllabus"][0]["unit_title"] == "Unit 1"


def test_faculty_availability_indicator(client, auth_headers, faculty_headers):
    # Get faculty user id
    res_f = client.get("/api/v1/auth/me", headers=faculty_headers)
    faculty_id = res_f.get_json()["user"]["id"]

    # Setup current weekday name
    now = datetime.now()
    weekday_map = {
        0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"
    }
    current_day_str = weekday_map[now.weekday()]

    with client.application.app_context():
        # Update faculty fields for rich profiles
        fac_user = db.session.get(User, faculty_id)
        fac_user.publications = "Paper 1, Paper 2"
        fac_user.research_interests = "Machine Learning"
        fac_user.office_hours = "2 PM - 4 PM"
        fac_user.office_location = "Room 304, CSE Block"

        # Create Timetable and Slot
        tt = Timetable(department="CSE", semester=4, section="A", name="CSE Sem-4 A", academic_year="2025-2026")
        db.session.add(tt)
        db.session.flush()

        slot = TimetableSlot(
            timetable_id=tt.id,
            day=DayOfWeek[current_day_str.upper()],
            period_number=1,
            start_time=time(0, 0),
            end_time=time(23, 59),
            slot_type=SlotType.LECTURE,
            subject_code="CS301",
            subject_name="Data Structures",
            faculty_id=faculty_id,
            faculty_name="Dr. Test Faculty",
            room_number="LH-101",
            building="CSE Block",
            is_cancelled=False
        )
        db.session.add(slot)
        db.session.commit()

    # Query directory
    res = client.get(f"/api/v1/academic/faculty-directory?q=Test", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["faculty"]) >= 1
    fac = data["faculty"][0]
    assert fac["availability_status"] == "In Class"
    assert "CS301" in fac["current_class"]
    assert fac["publications"] == "Paper 1, Paper 2"


def test_internal_marks_analytics(client, auth_headers):
    res_user = client.get("/api/v1/auth/me", headers=auth_headers)
    student_id = res_user.get_json()["user"]["id"]

    with client.application.app_context():
        # Create student 2 in the same department/semester
        other = User(
            email="other@veltech.edu.in", role=UserRole.STUDENT, first_name="Other", last_name="Student",
            department="CSE", semester=4, section="A", roll_number="22CSE998", is_verified=True
        )
        other.set_password("student123!")
        db.session.add(other)
        db.session.flush()

        m1 = InternalMark(student_id=student_id, subject_code="CS301", subject_name="Data Structures", semester=4, test_type="cat1", max_marks=50, marks_obtained=45.0)
        m2 = InternalMark(student_id=other.id, subject_code="CS301", subject_name="Data Structures", semester=4, test_type="cat1", max_marks=50, marks_obtained=20.0) # Low score
        db.session.add_all([m1, m2])
        db.session.commit()

    res = client.get("/api/v1/academic/internal-marks/analytics", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    # Class average: (90% + 40%) / 2 = 65% (Not struggling)
    assert data["class_stats"]["CS301"]["is_struggling"] is False


def test_exam_schedule_conflicts(client, faculty_headers):
    # Schedule first exam
    res = client.post("/api/v1/academic/exams", headers=faculty_headers, json={
        "subject_code": "CS301",
        "subject_name": "Data Structures",
        "department": "CSE",
        "semester": 4,
        "exam_date": "2026-06-15",
        "start_time": "09:30",
        "end_time": "12:30",
        "room_number": "LH-101",
        "building": "Main Block",
        "exam_type": "end_semester"
    })
    assert res.status_code == 201

    # Schedule conflicting exam at overlapping time
    res = client.post("/api/v1/academic/exams", headers=faculty_headers, json={
        "subject_code": "CS302",
        "subject_name": "Digital Logic",
        "department": "CSE",
        "semester": 4,
        "exam_date": "2026-06-15",
        "start_time": "11:00", # Overlaps with 09:30 - 12:30
        "end_time": "14:00",
        "room_number": "LH-102",
        "building": "Main Block",
        "exam_type": "end_semester"
    })
    assert res.status_code == 409
    assert "Exam conflict detected" in res.get_json()["error"]


def test_question_paper_ocr(client, faculty_headers):
    res = client.post("/api/v1/academic/question-papers", headers=faculty_headers, json={
        "subject_code": "CS301",
        "subject_name": "Data Structures",
        "department": "CSE",
        "semester": 4,
        "year": 2024,
        "exam_type": "end_semester",
        "file_url": "https://cdn.veltech.edu.in/pyq/cs301_2024.pdf"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert "Question paper uploaded" in data["message"]
    assert data["paper"]["ocr_content"] is None
