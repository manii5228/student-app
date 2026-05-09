"""
Auth Service
==============
Handles registration, login, JWT token management,
SSO flow, and session tracking.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Tuple

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token

from ..models.user import User, UserRole, UserSession, BiometricCredential
from ..repositories.user_repo import UserRepository, SessionRepository
from ..extensions import db, redis_client


def _detect_device_type(user_agent: str) -> str:
    """Parse User-Agent header to classify device type."""
    if not user_agent:
        return "unknown"
    ua = user_agent.lower()
    if any(k in ua for k in ["iphone", "android", "mobile", "okhttp"]):
        return "mobile"
    if any(k in ua for k in ["ipad", "tablet"]):
        return "tablet"
    return "desktop"


class AuthService:
    """Authentication and authorization service."""

    def __init__(self):
        self.user_repo = UserRepository()
        self.session_repo = SessionRepository()

    # ── Registration ───────────────────────────────────────────────

    def register(self, data: dict) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Register a new user.
        Returns (user_dict, None) on success or (None, error_message) on failure.
        """
        # Validate email uniqueness
        if self.user_repo.get_by_email(data["email"]):
            return None, "Email already registered"

        # Validate role-specific uniqueness
        if data.get("roll_number") and self.user_repo.get_by_roll_number(data["roll_number"]):
            return None, "Roll number already exists"

        if data.get("employee_id") and self.user_repo.get_by_employee_id(data["employee_id"]):
            return None, "Employee ID already exists"

        try:
            from werkzeug.security import generate_password_hash
            user = self.user_repo.create(
                email=data["email"],
                password_hash=generate_password_hash(data["password"]),
                role=UserRole(data.get("role", "student")),
                first_name=data["first_name"],
                last_name=data["last_name"],
                phone=data.get("phone"),
                department=data.get("department"),
                # Student fields
                roll_number=data.get("roll_number"),
                semester=data.get("semester"),
                section=data.get("section"),
                batch_year=data.get("batch_year"),
                # Faculty fields
                employee_id=data.get("employee_id"),
                designation=data.get("designation"),
                specialization=data.get("specialization"),
            )
            self.user_repo.commit()

            return user.to_dict(), None

        except Exception as e:
            self.user_repo.rollback()
            return None, f"Registration failed: {str(e)}"

    # ── Login ──────────────────────────────────────────────────────

    def login(self, email: str, password: str,
              device_info: str = None,
              ip_address: str = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Authenticate user and return JWT tokens + session info.
        """
        user = self.user_repo.get_by_email(email)

        if not user or not user.check_password(password):
            return None, "Invalid email or password"

        if not user.is_active:
            return None, "Account is deactivated. Contact admin."

        # Generate tokens
        jti = str(uuid.uuid4())
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                "role": user.role.value,
                "email": user.email,
                "name": user.full_name,
                "jti": jti,
            },
        )
        refresh_token = create_refresh_token(
            identity=user.id,
            additional_claims={"jti": jti},
        )

        # Create session record
        try:
            expires_at = datetime.now(timezone.utc) + current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]
            self.session_repo.create(
                user_id=user.id,
                jti=jti,
                device_info=device_info,
                device_type=_detect_device_type(device_info),
                ip_address=ip_address,
                expires_at=expires_at,
            )

            # Update last login
            user.last_login = datetime.now(timezone.utc)
            self.user_repo.commit()

        except Exception:
            self.user_repo.rollback()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict(),
        }, None

    # ── SSO Login (College Email) ──────────────────────────────────

    def sso_login(self, email: str, sso_token: str,
                  device_info: str = None,
                  ip_address: str = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        SSO login — verifies the college email domain and creates/fetches user.
        In production, `sso_token` would be validated against the college's
        identity provider (e.g., Microsoft Azure AD, Google Workspace).
        """
        # Validate college email domain
        allowed_domains = ["veltech.edu.in", "vel-tech.org", "veltech.ac.in"]
        domain = email.split("@")[-1].lower()

        if domain not in allowed_domains:
            return None, f"SSO is only available for college email addresses"

        # Check if user exists
        user = self.user_repo.get_by_email(email)

        if not user:
            return None, "No account found for this email. Please register first."

        if not user.is_active:
            return None, "Account is deactivated"

        # Mark as verified via SSO
        user.is_verified = True

        # Generate tokens (same as login)
        jti = str(uuid.uuid4())
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                "role": user.role.value,
                "email": user.email,
                "name": user.full_name,
                "jti": jti,
            },
        )
        refresh_token = create_refresh_token(
            identity=user.id,
            additional_claims={"jti": jti},
        )

        try:
            expires_at = datetime.now(timezone.utc) + current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]
            self.session_repo.create(
                user_id=user.id,
                jti=jti,
                device_info=device_info or "SSO Login",
                ip_address=ip_address,
                expires_at=expires_at,
            )
            user.last_login = datetime.now(timezone.utc)
            self.user_repo.commit()
        except Exception:
            self.user_repo.rollback()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict(),
            "sso": True,
        }, None

    # ── Token Refresh ──────────────────────────────────────────────

    def refresh_access_token(self, user_id: str) -> Tuple[Optional[str], Optional[str]]:
        """Generate a new access token from a valid refresh token."""
        user = self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            return None, "User not found or inactive"

        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                "role": user.role.value,
                "email": user.email,
                "name": user.full_name,
            },
        )
        return access_token, None

    # ── Session Management ─────────────────────────────────────────

    def get_active_sessions(self, user_id: str) -> list:
        """List all active sessions for a user."""
        sessions = self.session_repo.get_active_sessions(user_id)
        return [s.to_dict() for s in sessions]

    def revoke_session(self, user_id: str, session_id: str) -> bool:
        """Revoke a specific session."""
        session = self.session_repo.get_by_id(session_id)
        if session and session.user_id == user_id:
            session.is_active = False
            # Also add JTI to Redis blocklist
            try:
                redis_client.setex(
                    f"blocklist:{session.jti}", 86400, "revoked"
                )
            except Exception:
                pass
            self.session_repo.commit()
            return True
        return False

    def revoke_all_sessions(self, user_id: str) -> int:
        """Logout from all devices."""
        count = self.session_repo.revoke_all_sessions(user_id)
        self.session_repo.commit()
        return count

    # ── Password Management ────────────────────────────────────────

    def change_password(self, user_id: str, old_password: str,
                        new_password: str) -> Tuple[bool, Optional[str]]:
        """Change password with old password verification."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"

        if not user.check_password(old_password):
            return False, "Current password is incorrect"

        user.set_password(new_password)
        self.user_repo.commit()
        return True, None

    # ── Guest Mode ─────────────────────────────────────────────────

    def guest_login(self, device_info: str = None,
                    ip_address: str = None) -> Dict:
        """
        Guest mode — creates a transient JWT with role=GUEST.
        No database record; limited to Campus Map, Events (read-only), Notices.
        """
        guest_id = f"guest_{uuid.uuid4().hex[:12]}"
        jti = str(uuid.uuid4())

        access_token = create_access_token(
            identity=guest_id,
            additional_claims={
                "role": "guest",
                "email": None,
                "name": "Guest Visitor",
                "jti": jti,
                "is_guest": True,
            },
            expires_delta=timedelta(hours=4),  # short-lived
        )

        return {
            "access_token": access_token,
            "user": {
                "id": guest_id,
                "role": "guest",
                "full_name": "Guest Visitor",
                "is_guest": True,
            },
        }

    # ── Biometric / WebAuthn ───────────────────────────────────────

    def register_biometric(self, user_id: str, credential_id: str,
                           public_key: str, device_name: str = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Store a WebAuthn public key credential for passwordless auth.
        Called after the browser's navigator.credentials.create() ceremony.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return None, "User not found"

        # Check for duplicate credential
        existing = BiometricCredential.query.filter_by(credential_id=credential_id).first()
        if existing:
            return None, "Credential already registered"

        cred = BiometricCredential(
            user_id=user_id,
            credential_id=credential_id,
            public_key=public_key,
            device_name=device_name or _detect_device_type(None),
        )
        db.session.add(cred)
        db.session.commit()

        return cred.to_dict(), None

    def authenticate_biometric(self, credential_id: str,
                               sign_count: int,
                               device_info: str = None,
                               ip_address: str = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Validate a WebAuthn assertion.
        In production, you'd verify the signature with the stored public key.
        Here we validate credential existence + replay protection via sign_count.
        """
        cred = BiometricCredential.query.filter_by(
            credential_id=credential_id, is_active=True
        ).first()

        if not cred:
            return None, "Biometric credential not found"

        # Replay protection: sign_count must always increase
        if sign_count <= cred.sign_count:
            cred.is_active = False  # possible cloned key
            db.session.commit()
            return None, "Security alert: possible credential clone detected"

        cred.sign_count = sign_count
        cred.last_used = datetime.now(timezone.utc)

        user = self.user_repo.get_by_id(cred.user_id)
        if not user or not user.is_active:
            return None, "User not found or inactive"

        # Issue tokens (same flow as login)
        jti = str(uuid.uuid4())
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                "role": user.role.value,
                "email": user.email,
                "name": user.full_name,
                "jti": jti,
                "auth_method": "biometric",
            },
        )
        refresh_token = create_refresh_token(
            identity=user.id,
            additional_claims={"jti": jti},
        )

        try:
            expires_at = datetime.now(timezone.utc) + current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]
            self.session_repo.create(
                user_id=user.id,
                jti=jti,
                device_info=device_info or "Biometric Login",
                device_type=_detect_device_type(device_info),
                ip_address=ip_address,
                expires_at=expires_at,
            )
            user.last_login = datetime.now(timezone.utc)
            self.user_repo.commit()
        except Exception:
            self.user_repo.rollback()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict(),
            "auth_method": "biometric",
        }, None

    def list_biometric_credentials(self, user_id: str) -> list:
        """List all registered biometric credentials for a user."""
        creds = BiometricCredential.query.filter_by(
            user_id=user_id, is_active=True
        ).all()
        return [c.to_dict() for c in creds]

    def revoke_biometric(self, user_id: str, credential_id: str) -> bool:
        """Revoke a biometric credential."""
        cred = BiometricCredential.query.filter_by(
            id=credential_id, user_id=user_id
        ).first()
        if cred:
            cred.is_active = False
            db.session.commit()
            return True
        return False
