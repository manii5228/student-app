import pytest
from app.models.career import InterviewSchedule, SkillBadge, EarnedBadge, Internship, JobPosting
from app.models.user import User
from app.extensions import db

def test_interview_crud_and_compulsory_fields(client, faculty_headers, auth_headers):
    # 1. Create a job posting for eligibility
    with client.application.app_context():
        student = User.query.filter_by(email="test@veltech.edu.in").first()
        student_id = student.id
        
        job = JobPosting(company_name="Google", role_title="SDE", package_lpa=30.0)
        db.session.add(job)
        db.session.commit()
        posting_id = job.id

    # 2. Test POST /api/v1/career/interviews - missing fields validation
    resp = client.post("/api/v1/career/interviews", json={
        "student_id": student_id,
        "posting_id": posting_id
    }, headers=faculty_headers)
    assert resp.status_code == 400
    assert "compulsory" in resp.get_json()["error"]

    # 3. Test POST /api/v1/career/interviews - success
    resp = client.post("/api/v1/career/interviews", json={
        "student_id": student_id,
        "posting_id": posting_id,
        "round_name": "Technical Round 1",
        "scheduled_at": "2026-06-10T10:00:00",
        "venue": "Placement Cell"
    }, headers=faculty_headers)
    assert resp.status_code == 201
    ivid = resp.get_json()["schedule"]["id"]
    assert resp.get_json()["schedule"]["student_id"] == student_id

    # 4. Test PUT /api/v1/career/interviews/<ivid> - missing fields
    resp = client.put(f"/api/v1/career/interviews/{ivid}", json={
        "student_id": student_id,
        "posting_id": posting_id,
        "round_name": "Technical Round 2"
        # missing scheduled_at and venue
    }, headers=faculty_headers)
    assert resp.status_code == 400

    # 5. Test PUT /api/v1/career/interviews/<ivid> - success
    resp = client.put(f"/api/v1/career/interviews/{ivid}", json={
        "student_id": student_id,
        "posting_id": posting_id,
        "round_name": "Technical Round 2",
        "scheduled_at": "2026-06-11T14:30:00",
        "venue": "Main Block Cabin 102"
    }, headers=faculty_headers)
    assert resp.status_code == 200
    assert resp.get_json()["schedule"]["round_name"] == "Technical Round 2"
    assert resp.get_json()["schedule"]["venue"] == "Main Block Cabin 102"

    # 6. Test GET /api/v1/career/interviews/all
    resp = client.get("/api/v1/career/interviews/all", headers=faculty_headers)
    assert resp.status_code == 200
    interviews = resp.get_json()["interviews"]
    assert any(i["id"] == ivid and i["student_id"] == student_id for i in interviews)

    # 7. Test DELETE /api/v1/career/interviews/<ivid>
    resp = client.delete(f"/api/v1/career/interviews/{ivid}", headers=faculty_headers)
    assert resp.status_code == 200

    # Verify deleted
    with client.application.app_context():
        assert db.session.get(InterviewSchedule, ivid) is None


def test_badge_crud_and_cascade_delete(client, faculty_headers, auth_headers):
    # 1. Test POST /api/v1/career/badges - missing fields validation
    resp = client.post("/api/v1/career/badges", json={
        "name": "Quick Learner"
    }, headers=faculty_headers)
    assert resp.status_code == 400

    # 2. Test POST /api/v1/career/badges - success
    resp = client.post("/api/v1/career/badges", json={
        "name": "Quick Learner",
        "description": "Learns things quickly",
        "criteria": "Pass 5 tests",
        "points": 20
    }, headers=faculty_headers)
    assert resp.status_code == 201
    bid = resp.get_json()["badge"]["id"]

    # 3. Award badge to student
    with client.application.app_context():
        student = User.query.filter_by(email="test@veltech.edu.in").first()
        student_id = student.id
        faculty = User.query.filter_by(email="faculty.test@veltech.edu.in").first()
        faculty_id = faculty.id

    resp = client.post(f"/api/v1/career/badges/{bid}/award", json={
        "student_id": student_id,
        "note": "Excellent performance"
    }, headers=faculty_headers)
    assert resp.status_code == 201

    # Verify earned badge exists
    with client.application.app_context():
        eb = EarnedBadge.query.filter_by(badge_id=bid, student_id=student_id).first()
        assert eb is not None

    # 4. Test DELETE /api/v1/career/badges/<bid> - verify it cascades and deletes the earned badge record
    resp = client.delete(f"/api/v1/career/badges/{bid}", headers=faculty_headers)
    assert resp.status_code == 200

    with client.application.app_context():
        assert db.session.get(SkillBadge, bid) is None
        assert EarnedBadge.query.filter_by(badge_id=bid).first() is None


def test_internship_student_id_update(client, faculty_headers, auth_headers):
    # 1. Register second student via API client
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": "student2@veltech.edu.in",
        "password": "student2password",
        "first_name": "Second",
        "last_name": "Student",
        "role": "student",
        "department": "CSE",
        "roll_number": "22CSE888",
        "semester": 4,
        "section": "A",
    })
    assert reg_resp.status_code == 201

    with client.application.app_context():
        student1 = User.query.filter_by(email="test@veltech.edu.in").first()
        student1_id = student1.id
        student2 = User.query.filter_by(email="student2@veltech.edu.in").first()
        student2_id = student2.id

    # Add internship for student1
    resp = client.post("/api/v1/career/internships", json={
        "student_id": student1_id,
        "company_name": "Microsoft",
        "role_title": "Intern",
        "description": "Doing cool SDE work",
        "start_date": "2026-06-01",
        "end_date": "2026-08-31",
        "stipend": 50000,
        "mode": "remote",
        "skills_learned": "Python, SQL"
    }, headers=faculty_headers)
    assert resp.status_code == 201
    iid = resp.get_json()["internship"]["id"]
    assert resp.get_json()["internship"]["student_id"] == student1_id

    # 2. Update internship and change student_id
    resp = client.put(f"/api/v1/career/internships/{iid}", json={
        "student_id": student2_id,
        "company_name": "Microsoft",
        "role_title": "Intern",
        "description": "Doing cool SDE work",
        "start_date": "2026-06-01",
        "end_date": "2026-08-31",
        "stipend": 50000,
        "mode": "remote",
        "skills_learned": "Python, SQL"
    }, headers=faculty_headers)
    assert resp.status_code == 200
    assert resp.get_json()["internship"]["student_id"] == student2_id
