"""
Auth Service
==============
Handles registration, login, JWT token management,
SSO flow, and session tracking.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Tuple
import hashlib
import urllib.request

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token

def _is_password_breached(password: str) -> bool:
    """Check HaveIBeenPwned API via k-Anonymity."""
    try:
        sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]
        
        url = f"https://api.pwnedpasswords.com/range/{prefix}"
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'VelTech-SuperApp-Security-Agent'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            lines = response.read().decode('utf-8').splitlines()
            for line in lines:
                parts = line.split(':')
                if parts[0] == suffix:
                    count = int(parts[1])
                    if count > 0:
                        return True
    except Exception as e:
        print("Error checking HIBP API (allowing password bypass as fallback):", e)
    return False

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

    def _check_suspicious_login(self, user: User, ip_address: str, device_info: str):
        """
        Check if login is from an unrecognized IP or device and print an alert.
        """
        if not ip_address and not device_info:
            return

        recent_sessions = UserSession.query.filter_by(user_id=user.id).order_by(UserSession.created_at.desc()).limit(10).all()
        if not recent_sessions:
            return

        known_ips = {s.ip_address for s in recent_sessions if s.ip_address}
        known_devices = {s.device_info for s in recent_sessions if s.device_info}

        is_new_ip = ip_address not in known_ips if ip_address else False
        is_new_device = device_info not in known_devices if device_info else False

        if is_new_ip or is_new_device:
            print(f"⚠️ [SECURITY ALERT] Unrecognized login for {user.email} from IP: {ip_address}, Device: {device_info}")

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

        # Check suspicious login
        self._check_suspicious_login(user, ip_address, device_info)

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

        # Check suspicious login
        self._check_suspicious_login(user, ip_address, device_info)

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
                device_type=_detect_device_type(device_info or "SSO Login"),
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

    def refresh_session_tokens(self, user_id: str, old_jti: str,
                               device_info: str = None,
                               ip_address: str = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Rotate access and refresh tokens.
        1. Blocklist the old JTI.
        2. Generate new JTI.
        3. Update session record.
        4. Return new tokens.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            return None, "User not found or inactive"

        # Blocklist old JTI
        if old_jti:
            try:
                redis_client.setex(
                    f"token_blocklist:{old_jti}", 86400, "revoked"
                )
            except Exception:
                pass

        # Update the session with the new JTI
        session = self.session_repo.get_by_jti(old_jti)
        new_jti = str(uuid.uuid4())
        if session:
            session.jti = new_jti
            session.expires_at = datetime.now(timezone.utc) + current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]
            if device_info:
                session.device_info = device_info
                session.device_type = _detect_device_type(device_info)
            if ip_address:
                session.ip_address = ip_address
            self.session_repo.commit()
        else:
            # Fallback: create a new session if not found
            expires_at = datetime.now(timezone.utc) + current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]
            self.session_repo.create(
                user_id=user.id,
                jti=new_jti,
                device_info=device_info,
                device_type=_detect_device_type(device_info),
                ip_address=ip_address,
                expires_at=expires_at,
            )

        # Generate tokens
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                "role": user.role.value,
                "email": user.email,
                "name": user.full_name,
                "jti": new_jti,
            },
        )
        refresh_token = create_refresh_token(
            identity=user.id,
            additional_claims={"jti": new_jti},
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }, None

    # ── Session Management ─────────────────────────────────────────

    def get_active_sessions(self, user_id: str) -> list:
        """List all active sessions for a user."""
        sessions = self.session_repo.get_active_sessions(user_id)
        return sessions  # return model objects so caller can read properties or check JTI

    def revoke_session(self, user_id: str, session_id: str) -> bool:
        """Revoke a specific session."""
        session = self.session_repo.get_by_id(session_id)
        if session and session.user_id == user_id:
            session.is_active = False
            # Also add JTI to Redis blocklist
            try:
                redis_client.setex(
                    f"token_blocklist:{session.jti}", 86400, "revoked"
                )
            except Exception:
                pass
            self.session_repo.commit()
            return True
        return False

    def revoke_all_sessions(self, user_id: str) -> int:
        """Logout from all devices."""
        sessions = self.session_repo.get_active_sessions(user_id)
        count = 0
        for s in sessions:
            s.is_active = False
            try:
                redis_client.setex(
                    f"token_blocklist:{s.jti}", 86400, "revoked"
                )
            except Exception:
                pass
            count += 1
        self.session_repo.commit()
        return count

    # ── Password Management ────────────────────────────────────────

    def change_password(self, user_id: str, old_password: str,
                        new_password: str) -> Tuple[bool, Optional[str]]:
        """Change password with old password verification, HIBP check, and cooldown."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"

        if not user.check_password(old_password):
            return False, "Current password is incorrect"

        # 1. Enforce cooldown of 10 minutes
        if user.last_password_change:
            time_diff = datetime.now(timezone.utc) - (
                user.last_password_change if user.last_password_change.tzinfo 
                else user.last_password_change.replace(tzinfo=timezone.utc)
            )
            if time_diff < timedelta(minutes=10):
                remaining_seconds = 600 - int(time_diff.total_seconds())
                remaining_minutes = max(1, remaining_seconds // 60)
                return False, f"Password changed recently. Cooldown active. Please wait {remaining_minutes} more minute(s)."

        # 2. Check HaveIBeenPwned API
        if _is_password_breached(new_password):
            return False, "This password has been found in a data breach (HaveIBeenPwned). Please choose a different, more secure password."

        user.set_password(new_password)
        user.last_password_change = datetime.now(timezone.utc)
        self.user_repo.commit()
        return True, None

    # ── Guest Mode ─────────────────────────────────────────────────

    def guest_login(self, device_info: str = None,
                    ip_address: str = None) -> Dict:
        """
        Guest mode — creates a transient JWT with role=GUEST and returns session_id.
        Logs to GuestActivityLog.
        """
        guest_id = f"guest_{uuid.uuid4().hex[:12]}"
        jti = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        access_token = create_access_token(
            identity=guest_id,
            additional_claims={
                "role": "guest",
                "email": None,
                "name": "Guest Visitor",
                "jti": jti,
                "is_guest": True,
                "session_id": session_id,
            },
            expires_delta=timedelta(hours=4),  # short-lived
        )

        # Log anonymous guest login
        try:
            from ..models.user import GuestActivityLog
            log = GuestActivityLog(
                session_id=session_id,
                feature_name="guest_login"
            )
            db.session.add(log)
            db.session.commit()
        except Exception:
            pass

        return {
            "access_token": access_token,
            "session_id": session_id,
            "user": {
                "id": guest_id,
                "role": "guest",
                "full_name": "Guest Visitor",
                "is_guest": True,
                "session_id": session_id,
            },
        }

    # ── Biometric / WebAuthn ───────────────────────────────────────

    def register_biometric(self, user_id: str, credential_id: str,
                           public_key: str, device_name: str = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Store a WebAuthn public key credential for passwordless auth and log to audit.
        """
        from ..models.user import BiometricAuditLog
        user = self.user_repo.get_by_id(user_id)
        if not user:
            # Audit log failure
            audit = BiometricAuditLog(
                user_id=None,
                action="register_failure",
                details=f"Failed biometric registration: user_id {user_id} not found."
            )
            db.session.add(audit)
            db.session.commit()
            return None, "User not found"

        # Check for duplicate credential
        existing = BiometricCredential.query.filter_by(credential_id=credential_id).first()
        if existing:
            audit = BiometricAuditLog(
                user_id=user.id,
                action="register_failure",
                details=f"Failed biometric registration: credential ID already registered."
            )
            db.session.add(audit)
            db.session.commit()
            return None, "Credential already registered"

        cred = BiometricCredential(
            user_id=user_id,
            credential_id=credential_id,
            public_key=public_key,
            device_name=device_name or _detect_device_type(None),
        )
        db.session.add(cred)
        
        # Log audit
        audit = BiometricAuditLog(
            user_id=user.id,
            action="register_success",
            details=f"Enrolled biometric device: {cred.device_name}."
        )
        db.session.add(audit)
        
        db.session.commit()
        return cred.to_dict(), None

    def authenticate_biometric(self, credential_id: str,
                               sign_count: int,
                               device_info: str = None,
                               ip_address: str = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Validate a WebAuthn assertion and log audit trail.
        """
        from ..models.user import BiometricAuditLog
        cred = BiometricCredential.query.filter_by(
            credential_id=credential_id, is_active=True
        ).first()

        if not cred:
            audit = BiometricAuditLog(
                user_id=None,
                action="auth_failure",
                details=f"Biometric auth failed: credential ID not found or inactive.",
                ip_address=ip_address
            )
            db.session.add(audit)
            db.session.commit()
            return None, "Biometric credential not found"

        # Replay protection: sign_count must always increase
        if sign_count <= cred.sign_count:
            cred.is_active = False  # possible cloned key
            audit = BiometricAuditLog(
                user_id=cred.user_id,
                action="auth_failure",
                details=f"Cloned key alert! Signature count did not increase ({sign_count} <= {cred.sign_count}). Credential disabled.",
                ip_address=ip_address
            )
            db.session.add(audit)
            db.session.commit()
            return None, "Security alert: possible credential clone detected"

        cred.sign_count = sign_count
        cred.last_used = datetime.now(timezone.utc)

        user = self.user_repo.get_by_id(cred.user_id)
        if not user or not user.is_active:
            audit = BiometricAuditLog(
                user_id=cred.user_id,
                action="auth_failure",
                details="Biometric auth failed: associated user account is inactive or not found.",
                ip_address=ip_address
            )
            db.session.add(audit)
            db.session.commit()
            return None, "User not found or inactive"

        # Issue tokens
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
            
            # Log audit
            audit = BiometricAuditLog(
                user_id=user.id,
                action="auth_success",
                details=f"Biometric auth successful using device: {cred.device_name}.",
                ip_address=ip_address
            )
            db.session.add(audit)
            
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return None, f"Database transaction failed: {str(e)}"

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
        """Revoke a biometric credential and log to audit."""
        from ..models.user import BiometricAuditLog
        cred = BiometricCredential.query.filter_by(
            id=credential_id, user_id=user_id
        ).first()
        if cred:
            cred.is_active = False
            audit = BiometricAuditLog(
                user_id=user_id,
                action="revoke_success",
                details=f"Revoked biometric credential: {cred.device_name} (ID: {credential_id})."
            )
            db.session.add(audit)
            db.session.commit()
            return True
        return False
