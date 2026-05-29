"""
Test fixtures and configuration.
Uses SQLite for fast, isolated testing.
"""

import pytest
from app import create_app
from app.extensions import db as _db


@pytest.fixture(scope="function")
def app():
    """Create application for testing — fresh per test."""
    app = create_app("testing")
    with app.app_context():
        _db.drop_all()
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    """Test client."""
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Register and login a student, return auth headers."""
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": "test@veltech.edu.in",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "Student",
        "role": "student",
        "department": "CSE",
        "roll_number": "22CSE999",
        "semester": 4,
        "section": "A",
    })
    if reg_resp.status_code != 201:
        raise Exception(f"Registration failed: status={reg_resp.status_code}, data={reg_resp.get_json()}")
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@veltech.edu.in",
        "password": "testpass123",
    })
    data = resp.get_json()
    if not data or "access_token" not in data:
        raise Exception(f"Login failed: status={resp.status_code}, data={data}")
    token = data["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def faculty_headers(client):
    """Register and login a faculty member, return auth headers."""
    client.post("/api/v1/auth/register", json={
        "email": "faculty.test@veltech.edu.in",
        "password": "faculty123!",
        "first_name": "Dr. Test",
        "last_name": "Faculty",
        "role": "faculty",
        "department": "CSE",
        "employee_id": "FAC999",
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "faculty.test@veltech.edu.in",
        "password": "faculty123!",
    })
    data = resp.get_json()
    token = data["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client):
    """Register and login an admin, return auth headers."""
    client.post("/api/v1/auth/register", json={
        "email": "admin.test@veltech.edu.in",
        "password": "admin123!",
        "first_name": "Test",
        "last_name": "Admin",
        "role": "admin",
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "admin.test@veltech.edu.in",
        "password": "admin123!",
    })
    data = resp.get_json()
    token = data["access_token"]
    return {"Authorization": f"Bearer {token}"}
