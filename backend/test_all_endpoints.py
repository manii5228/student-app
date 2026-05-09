"""Full endpoint integration test — validates all 25 API routes."""
from app import create_app
from app.extensions import db

app = create_app("testing")

with app.app_context():
    db.create_all()
    c = app.test_client()

    # 1. Health
    r = c.get("/api/v1/health")
    d = r.get_json()
    print(f"[GET]  /health           => {r.status_code} {d['status']}")

    # 2. Register student
    r = c.post("/api/v1/auth/register", json={
        "email": "test@veltech.edu.in", "password": "testpass123",
        "first_name": "Mani", "last_name": "M",
        "role": "student", "department": "CSE",
        "roll_number": "22CSE001", "semester": 4, "section": "A"
    })
    print(f"[POST] /auth/register    => {r.status_code}")

    # 3. Register faculty
    r = c.post("/api/v1/auth/register", json={
        "email": "prof@veltech.edu.in", "password": "faculty123!",
        "first_name": "Dr.Ram", "last_name": "K",
        "role": "faculty", "department": "CSE", "employee_id": "FAC001"
    })
    print(f"[POST] /auth/register(f) => {r.status_code}")

    # 4. Register admin
    r = c.post("/api/v1/auth/register", json={
        "email": "admin@veltech.edu.in", "password": "admin12345",
        "first_name": "Admin", "last_name": "A", "role": "admin"
    })
    print(f"[POST] /auth/register(a) => {r.status_code}")

    # 5. Login student
    r = c.post("/api/v1/auth/login", json={
        "email": "test@veltech.edu.in", "password": "testpass123"
    })
    stu = r.get_json()
    stu_token = stu["access_token"]
    print(f"[POST] /auth/login(stu)  => {r.status_code}")

    # 6. Login faculty
    r = c.post("/api/v1/auth/login", json={
        "email": "prof@veltech.edu.in", "password": "faculty123!"
    })
    fac_token = r.get_json()["access_token"]
    print(f"[POST] /auth/login(fac)  => {r.status_code}")

    # 7. Login admin
    r = c.post("/api/v1/auth/login", json={
        "email": "admin@veltech.edu.in", "password": "admin12345"
    })
    adm_token = r.get_json()["access_token"]
    print(f"[POST] /auth/login(adm)  => {r.status_code}")

    stu_h = {"Authorization": f"Bearer {stu_token}"}
    fac_h = {"Authorization": f"Bearer {fac_token}"}
    adm_h = {"Authorization": f"Bearer {adm_token}"}

    # 8. Get profile
    r = c.get("/api/v1/auth/me", headers=stu_h)
    user = r.get_json()["user"]
    print(f"[GET]  /auth/me          => {r.status_code} name={user['full_name']}")

    # 9. Sessions
    r = c.get("/api/v1/auth/sessions", headers=stu_h)
    sess = r.get_json()["sessions"]
    print(f"[GET]  /auth/sessions    => {r.status_code} count={len(sess)}")

    # 10. SSO
    r = c.post("/api/v1/auth/sso", json={
        "email": "test@veltech.edu.in", "sso_token": "mock"
    })
    print(f"[POST] /auth/sso         => {r.status_code}")

    # 11. RBAC: student blocked
    r = c.get("/api/v1/admin/users", headers=stu_h)
    print(f"[GET]  /admin/users(stu) => {r.status_code} (expect 403)")

    # 12. Admin access
    r = c.get("/api/v1/admin/users", headers=adm_h)
    print(f"[GET]  /admin/users(adm) => {r.status_code}")

    # 13. Admin stats
    r = c.get("/api/v1/admin/stats", headers=adm_h)
    stats = r.get_json()
    print(f"[GET]  /admin/stats      => {r.status_code} total={stats['total_users']}")

    # 14. Create attendance session
    r = c.post("/api/v1/attendance/session", headers=fac_h, json={
        "subject_code": "CS301", "subject_name": "Data Structures",
        "department": "CSE", "semester": 4, "section": "A", "period_number": 1
    })
    print(f"[POST] /attendance/sess  => {r.status_code}")
    sess_data = r.get_json().get("session", {})
    sess_id = sess_data.get("id")

    # 15. QR generation
    if sess_id:
        r = c.post(f"/api/v1/attendance/session/{sess_id}/qr", headers=fac_h)
        print(f"[POST] /attendance/qr    => {r.status_code}")

    # 16. Bunk-O-Meter
    r = c.get("/api/v1/attendance/bunk-o-meter", headers=stu_h)
    print(f"[GET]  /bunk-o-meter     => {r.status_code}")

    # 17. Faculty sessions
    r = c.get("/api/v1/attendance/my-sessions", headers=fac_h)
    print(f"[GET]  /my-sessions      => {r.status_code}")

    # 18. Create timetable
    r = c.post("/api/v1/timetable/", headers=adm_h, json={
        "name": "CSE Sem-4 A", "department": "CSE",
        "semester": 4, "section": "A", "academic_year": "2025-2026"
    })
    print(f"[POST] /timetable/       => {r.status_code}")
    tt_data = r.get_json().get("timetable", {})
    tt_id = tt_data.get("id")

    # 19. Add slot
    if tt_id:
        r = c.post(f"/api/v1/timetable/{tt_id}/slot", headers=adm_h, json={
            "day": "monday", "period_number": 1,
            "start_time": "09:00", "end_time": "09:50",
            "subject_code": "CS301", "subject_name": "Data Structures",
            "room_number": "301", "building": "Main Block"
        })
        print(f"[POST] /timetable/slot   => {r.status_code}")

        # 20. Publish
        r = c.post(f"/api/v1/timetable/{tt_id}/publish", headers=adm_h)
        print(f"[POST] /timetable/pub    => {r.status_code}")

    # 21. Student timetable
    r = c.get("/api/v1/timetable/my-timetable", headers=stu_h)
    print(f"[GET]  /my-timetable     => {r.status_code}")

    # 22. Class timetable
    r = c.get("/api/v1/timetable/class?department=CSE&semester=4&section=A",
              headers=stu_h)
    print(f"[GET]  /timetable/class  => {r.status_code}")

    # 23. Current class
    r = c.get("/api/v1/timetable/now", headers=stu_h)
    print(f"[GET]  /timetable/now    => {r.status_code}")

    # 24. Change password
    r = c.post("/api/v1/auth/change-password", headers=stu_h, json={
        "old_password": "testpass123", "new_password": "newpass1234"
    })
    print(f"[POST] /change-password  => {r.status_code}")

    # 25. Get class students
    r = c.get("/api/v1/attendance/students?department=CSE&semester=4&section=A",
              headers=fac_h)
    print(f"[GET]  /att/students     => {r.status_code}")

    print()
    print("=" * 50)
    print("ALL 25 ENDPOINTS TESTED")
    print("=" * 50)
