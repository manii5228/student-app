"""
Auth API Tests
===============
Tests for registration, login, SSO, sessions, and RBAC.
"""

import pytest


class TestRegistration:
    def test_register_student(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "email": "new@veltech.edu.in",
            "password": "securepass",
            "first_name": "New",
            "last_name": "Student",
            "role": "student",
            "department": "CSE",
            "roll_number": "22CSE100",
            "semester": 3,
            "section": "A",
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["user"]["email"] == "new@veltech.edu.in"
        assert data["user"]["role"] == "student"

    def test_duplicate_email(self, client):
        payload = {
            "email": "dup@veltech.edu.in", "password": "pass1234",
            "first_name": "A", "last_name": "B",
        }
        client.post("/api/v1/auth/register", json=payload)
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 409

    def test_missing_fields(self, client):
        resp = client.post("/api/v1/auth/register", json={"email": "x@y.com"})
        assert resp.status_code == 400

    def test_short_password(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "email": "x@veltech.edu.in", "password": "short",
            "first_name": "A", "last_name": "B",
        })
        assert resp.status_code == 400


class TestLogin:
    def test_login_success(self, client):
        client.post("/api/v1/auth/register", json={
            "email": "login@veltech.edu.in", "password": "testpass1",
            "first_name": "A", "last_name": "B",
        })
        resp = client.post("/api/v1/auth/login", json={
            "email": "login@veltech.edu.in", "password": "testpass1",
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_wrong_password(self, client):
        client.post("/api/v1/auth/register", json={
            "email": "wp@veltech.edu.in", "password": "correct1",
            "first_name": "A", "last_name": "B",
        })
        resp = client.post("/api/v1/auth/login", json={
            "email": "wp@veltech.edu.in", "password": "wrong123",
        })
        assert resp.status_code == 401


class TestRBAC:
    def test_student_cannot_access_admin(self, client, auth_headers):
        resp = client.get("/api/v1/admin/users", headers=auth_headers)
        assert resp.status_code == 403

    def test_admin_can_access_admin(self, client, admin_headers):
        resp = client.get("/api/v1/admin/users", headers=admin_headers)
        assert resp.status_code == 200


class TestProfile:
    def test_get_profile(self, client, auth_headers):
        resp = client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert "user" in resp.get_json()

    def test_no_auth_returns_401(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401


class TestSessions:
    def test_list_sessions(self, client, auth_headers):
        resp = client.get("/api/v1/auth/sessions", headers=auth_headers)
        assert resp.status_code == 200
        assert "sessions" in resp.get_json()
