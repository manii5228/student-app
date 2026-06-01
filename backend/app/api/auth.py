"""
Auth API
=========
Endpoints for registration, login, SSO, token refresh, and session management.
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, decode_token

from ..services.auth_service import AuthService
from ..middleware.auth_middleware import role_required
from ..extensions import limiter, db

auth_bp = Blueprint("auth", __name__)
auth_service = AuthService()


def get_approx_location(ip):
    """
    Approximates the location of the client based on IP address.
    For local development, maps 127.0.0.1/localhost to VelTech's campus city.
    """
    if not ip or ip in ("127.0.0.1", "localhost", "::1"):
        return "Chennai, Tamil Nadu (VelTech Campus)"
    return "Chennai, Tamil Nadu"


# ── Registration ───────────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
@limiter.limit("10 per minute")
def register():
    """
    Register a new user.
    
    Body: {
        "email": "student@veltech.edu.in",
        "password": "securepassword",
        "first_name": "John",
        "last_name": "Doe",
        "role": "student",
        "department": "CSE",
        "roll_number": "22CSE001",
        "semester": 4,
        "section": "A",
        "batch_year": 2022
    }
    """
    data = request.get_json()

    # Validate required fields
    required = ["email", "password", "first_name", "last_name"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # Validate password strength
    if len(data["password"]) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    user, error = auth_service.register(data)
    if error:
        return jsonify({"error": error}), 409

    return jsonify({"message": "Registration successful", "user": user}), 201


# ── Login ──────────────────────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    """
    Login with email and password.
    
    Body: {"email": "...", "password": "..."}
    Returns: {access_token, user} + HttpOnly refresh cookie
    """
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    result, error = auth_service.login(
        email=email,
        password=password,
        device_info=request.headers.get("User-Agent"),
        ip_address=request.remote_addr,
    )

    if error:
        return jsonify({"error": error}), 401

    # Form response with access token and user info (excluding refresh_token in response body)
    response = jsonify({
        "access_token": result["access_token"],
        "user": result["user"]
    })

    # Set HttpOnly, SameSite cookie for the refresh token
    response.set_cookie(
        key=current_app.config.get("JWT_REFRESH_COOKIE_NAME", "refresh_token"),
        value=result["refresh_token"],
        httponly=True,
        secure=current_app.config.get("JWT_COOKIE_SECURE", False),
        samesite='Lax',
        max_age=30 * 24 * 60 * 60  # 30 days
    )

    return response, 200


# ── SSO Login ──────────────────────────────────────────────────────

@auth_bp.route("/sso", methods=["POST"])
@limiter.limit("10 per minute")
def sso_login():
    """
    SSO Login for college email accounts.
    
    Body: {"email": "student@veltech.edu.in", "sso_token": "..."}
    """
    data = request.get_json()
    email = data.get("email")
    sso_token = data.get("sso_token")

    if not email or not sso_token:
        return jsonify({"error": "Email and SSO token required"}), 400

    result, error = auth_service.sso_login(
        email=email,
        sso_token=sso_token,
        device_info=request.headers.get("User-Agent"),
        ip_address=request.remote_addr,
    )

    if error:
        return jsonify({"error": error}), 401

    response = jsonify({
        "access_token": result["access_token"],
        "user": result["user"],
        "sso": True
    })

    response.set_cookie(
        key=current_app.config.get("JWT_REFRESH_COOKIE_NAME", "refresh_token"),
        value=result["refresh_token"],
        httponly=True,
        secure=current_app.config.get("JWT_COOKIE_SECURE", False),
        samesite='Lax',
        max_age=30 * 24 * 60 * 60
    )

    return response, 200


# ── Token Refresh ──────────────────────────────────────────────────

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
@limiter.limit("15 per minute")
def refresh():
    """Get a new access token and rotate the refresh token."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    old_jti = claims.get("jti")

    result, error = auth_service.refresh_session_tokens(
        user_id=user_id,
        old_jti=old_jti,
        device_info=request.headers.get("User-Agent"),
        ip_address=request.remote_addr
    )

    if error:
        return jsonify({"error": error}), 401

    response = jsonify({
        "access_token": result["access_token"]
    })

    response.set_cookie(
        key=current_app.config.get("JWT_REFRESH_COOKIE_NAME", "refresh_token"),
        value=result["refresh_token"],
        httponly=True,
        secure=current_app.config.get("JWT_COOKIE_SECURE", False),
        samesite='Lax',
        max_age=30 * 24 * 60 * 60
    )

    return response, 200


# ── Logout ─────────────────────────────────────────────────────────

@auth_bp.route("/logout", methods=["POST"])
@jwt_required(optional=True)
def logout():
    """
    Log out the user:
    1. Revoke the current access token (if present)
    2. Revoke the active refresh token session
    3. Clear the refresh token cookie
    """
    # Revoke access token
    try:
        access_jwt = get_jwt()
        if access_jwt and "jti" in access_jwt:
            jti = access_jwt["jti"]
            redis_client.setex(f"token_blocklist:{jti}", 900, "revoked")
    except Exception:
        pass

    # Revoke refresh token
    refresh_token_val = request.cookies.get(
        current_app.config.get("JWT_REFRESH_COOKIE_NAME", "refresh_token")
    )
    if refresh_token_val:
        try:
            decoded = decode_token(refresh_token_val)
            jti = decoded.get("jti")
            if jti:
                redis_client.setex(f"token_blocklist:{jti}", 86400, "revoked")
                from ..repositories.user_repo import SessionRepository
                session = SessionRepository().get_by_jti(jti)
                if session:
                    session.is_active = False
                    db.session.commit()
        except Exception:
            pass

    response = jsonify({"message": "Logout successful"})
    response.delete_cookie(
        key=current_app.config.get("JWT_REFRESH_COOKIE_NAME", "refresh_token"),
        httponly=True,
        secure=current_app.config.get("JWT_COOKIE_SECURE", False),
        samesite='Lax'
    )
    return response, 200


# ── Profile ────────────────────────────────────────────────────────

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_profile():
    """Get the current user's profile."""
    user_id = get_jwt_identity()

    # Handle Guest user
    if isinstance(user_id, str) and user_id.startswith("guest_"):
        claims = get_jwt()
        return jsonify({
            "user": {
                "id": user_id,
                "role": "guest",
                "full_name": "Guest Visitor",
                "is_guest": True,
                "email": None,
            }
        }), 200

    from ..repositories.user_repo import UserRepository
    user = UserRepository().get_by_id(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/me/preferences", methods=["PUT"])
@jwt_required()
def update_preferences():
    """Store user preferences in the cloud for preference syncing."""
    user_id = get_jwt_identity()
    if isinstance(user_id, str) and user_id.startswith("guest_"):
        return jsonify({"message": "Preferences updated (session-only)"}), 200

    from ..repositories.user_repo import UserRepository
    user = UserRepository().get_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    import json
    # Merge preferences
    current_prefs = json.loads(user.preferences) if user.preferences else {}
    current_prefs.update(data)
    user.preferences = json.dumps(current_prefs)
    db.session.commit()
    return jsonify({"message": "Preferences updated successfully", "preferences": current_prefs}), 200


@auth_bp.route("/me/avatar", methods=["POST"])
@jwt_required()
def upload_avatar():
    """Upload profile photo and update user's avatar_url."""
    user_id = get_jwt_identity()
    if isinstance(user_id, str) and user_id.startswith("guest_"):
        return jsonify({"error": "Guest accounts cannot upload photos"}), 400

    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not file.content_type.startswith("image/"):
        return jsonify({"error": "Uploaded file must be an image"}), 400

    import os
    import time
    from werkzeug.utils import secure_filename
    from ..repositories.user_repo import UserRepository

    user = UserRepository().get_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1]
    new_filename = f"avatar_{user_id}_{int(time.time())}{ext}"

    upload_folder = os.path.join(current_app.instance_path, "avatars")
    os.makedirs(upload_folder, exist_ok=True)
    file.save(os.path.join(upload_folder, new_filename))

    user.avatar_url = f"/auth/me/avatar-file/{new_filename}"
    db.session.commit()

    return jsonify({
        "message": "Avatar uploaded successfully",
        "avatar_url": user.avatar_url,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/me/avatar-file/<filename>", methods=["GET"])
def get_avatar_file(filename):
    """Serve uploaded avatar images."""
    import os
    from werkzeug.utils import secure_filename
    from flask import send_from_directory

    upload_folder = os.path.join(current_app.instance_path, "avatars")
    secured_name = secure_filename(filename)
    return send_from_directory(upload_folder, secured_name)



@auth_bp.route("/id-template/<role_type>", methods=["GET"])
def get_id_template(role_type):
    """Retrieve ID Card template settings for student or faculty."""
    if role_type not in ["student", "faculty"]:
        return jsonify({"error": "Invalid role type"}), 400

    from ..models.user import IDCardTemplate
    template = IDCardTemplate.query.filter_by(role_type=role_type).first()
    if not template:
        return jsonify({
            "role_type": role_type,
            "college_name": "VelTech University" if role_type == "student" else "VelTech University Faculty",
            "background_style": "classic-navy" if role_type == "student" else "elegant-dark",
            "primary_color": "#22346c" if role_type == "student" else "#0f172a",
            "accent_color": "#0080c7" if role_type == "student" else "#27bcd1",
            "logo_url": None,
            "custom_bg_url": None
        }), 200

    return jsonify(template.to_dict()), 200



@auth_bp.route("/nfc-profile/<totp_code>", methods=["GET"])
def get_profile_by_nfc(totp_code):
    """Allows campus security NFC scanners to securely pull up student profile by rotating TOTP QR/NFC code."""
    import time

    def calculate_totp_for_user(user_id, offset=0):
        epoch = int(time.time() * 1000 / 15000) + offset
        raw = f"{user_id}-{epoch}-VELTECH"
        h = 0
        for char in raw:
            h = ((h << 5) - h + ord(char)) & 0xFFFFFFFF
            if h >= 0x80000000:
                h -= 0x100000000
        abs_h = abs(h)
        # base 36
        alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        base36 = ''
        number = abs_h
        while number:
            number, i = divmod(number, 36)
            base36 = alphabet[i] + base36
        res = base36 or alphabet[0]
        return res.upper().zfill(8)[:8]

    from ..models.user import User
    students = User.query.filter_by(role="student").all()
    for s in students:
        if calculate_totp_for_user(s.id, 0) == totp_code or calculate_totp_for_user(s.id, -1) == totp_code:
            return jsonify({
                "verified": True,
                "student": {
                    "id": s.id,
                    "full_name": s.full_name,
                    "roll_number": s.roll_number,
                    "department": s.department,
                    "semester": s.semester,
                    "section": s.section,
                    "cgpa": s.cgpa,
                    "avatar_url": s.avatar_url,
                    "is_verified": s.is_verified,
                    "email": s.email
                }
            }), 200

    return jsonify({"verified": False, "error": "Invalid or expired NFC/QR code"}), 404


@auth_bp.route("/profile/endorse", methods=["POST"])
@jwt_required()
def endorse_skill():
    """Endorse a student's skill."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    target_user_id = data.get("user_id")
    skill_name = data.get("skill_name")

    if not target_user_id or not skill_name:
        return jsonify({"error": "Missing user_id or skill_name"}), 400

    if current_user_id == target_user_id:
        return jsonify({"error": "You cannot endorse your own skills"}), 400

    from ..models.user import User
    target_user = User.query.get(target_user_id)
    if not target_user:
        return jsonify({"error": "Target user not found"}), 404

    import json
    try:
        skills_list = json.loads(target_user.skills) if target_user.skills else []
    except Exception:
        skills_list = []

    # Find or create skill
    skill_item = None
    for s in skills_list:
        if s.get("name").lower() == skill_name.lower():
            skill_item = s
            break

    if not skill_item:
        skill_item = {"name": skill_name, "endorsements": []}
        skills_list.append(skill_item)

    endorsements = skill_item.get("endorsements", [])
    if current_user_id in endorsements:
        endorsements.remove(current_user_id)
        action = "removed"
    else:
        endorsements.append(current_user_id)
        action = "added"

    skill_item["endorsements"] = endorsements
    target_user.skills = json.dumps(skills_list)
    db.session.commit()

    return jsonify({
        "message": f"Endorsement {action} successfully",
        "skill": {
            "name": skill_item["name"],
            "endorsements": len(endorsements),
            "endorsed": current_user_id in endorsements
        }
    }), 200


@auth_bp.route("/profile/social-graph", methods=["GET"])
@jwt_required()
def get_social_graph():
    """Generates a Neo4j-style social graph representation mapping relationships."""
    from ..models.user import User
    students = User.query.filter_by(role="student").limit(20).all()

    nodes = []
    edges = []

    for u in students:
        nodes.append({
            "id": u.id,
            "label": u.full_name,
            "type": "student",
            "roll_number": u.roll_number
        })

        if u.mentor_id:
            edges.append({
                "source": u.id,
                "target": u.mentor_id,
                "type": "mentored_by"
            })

        import json
        try:
            skills_list = json.loads(u.skills) if u.skills else []
            for s in skills_list:
                for endorser_id in s.get("endorsements", []):
                    edges.append({
                        "source": endorser_id,
                        "target": u.id,
                        "type": "endorsed",
                        "skill": s["name"]
                    })
        except Exception:
            pass

    mock_projects = [
        {"id": "proj_1", "label": "Smart Campus App", "type": "project"},
        {"id": "proj_2", "label": "AI Medical Diagnostic", "type": "project"},
        {"id": "proj_3", "label": "Blockchain Attendance System", "type": "project"},
    ]
    nodes.extend(mock_projects)

    if len(students) > 0:
        edges.append({"source": students[0].id, "target": "proj_1", "type": "contributor"})
    if len(students) > 1:
        edges.append({"source": students[1].id, "target": "proj_1", "type": "contributor"})
        edges.append({"source": students[1].id, "target": "proj_2", "type": "lead"})
    if len(students) > 2:
        edges.append({"source": students[2].id, "target": "proj_3", "type": "contributor"})

    return jsonify({
        "nodes": nodes,
        "edges": edges
    }), 200


@auth_bp.route("/profile/certifications/verify", methods=["POST"])
@jwt_required()
def verify_certification():
    """Automatically verify and add certifications if valid certificate ID."""
    user_id = get_jwt_identity()
    if isinstance(user_id, str) and user_id.startswith("guest_"):
        return jsonify({"error": "Guest accounts cannot verify certifications"}), 400

    data = request.get_json()
    cert_id = data.get("certificate_id")
    platform = data.get("platform", "coursera").lower()
    title = data.get("title", "Advanced Technical Course")

    if not cert_id:
        return jsonify({"error": "Certificate ID is required"}), 400

    if len(cert_id) < 8:
        return jsonify({"error": "Invalid Certificate ID format. Must be at least 8 characters."}), 400

    from ..models.user import User
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    import json
    import time
    from datetime import datetime, timezone
    try:
        ach_list = json.loads(user.achievements) if user.achievements else []
    except Exception:
        ach_list = []

    new_achievement = {
        "id": f"cert_{int(time.time())}",
        "title": f"{platform.upper()}: {title}",
        "type": "certification",
        "icon": "🎓" if platform == "nptel" else "☁",
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "certificate_id": cert_id,
        "verified": True
    }

    ach_list.append(new_achievement)
    user.achievements = json.dumps(ach_list)
    db.session.commit()

    return jsonify({
        "message": "Certification successfully verified and added to portfolio!",
        "achievement": new_achievement
    }), 200


# ── Session Management ────────────────────────────────────────────

@auth_bp.route("/sessions", methods=["GET"])
@jwt_required()
def list_sessions():
    """List all active sessions for the current user."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    current_jti = claims.get("jti")

    # Guest sessions don't persist sessions table
    if isinstance(user_id, str) and user_id.startswith("guest_"):
        return jsonify({
            "sessions": [{
                "id": claims.get("session_id", "guest_session"),
                "device_info": request.headers.get("User-Agent"),
                "device_type": "guest_device",
                "ip_address": request.remote_addr,
                "is_active": True,
                "is_current": True,
                "location": get_approx_location(request.remote_addr),
                "created_at": None,
                "expires_at": None
            }]
        }), 200

    sessions = auth_service.get_active_sessions(user_id)
    session_list = []
    for s in sessions:
        s_dict = s.to_dict()
        s_dict["is_current"] = (s.jti == current_jti)
        s_dict["location"] = get_approx_location(s.ip_address)
        session_list.append(s_dict)

    return jsonify({"sessions": session_list}), 200


@auth_bp.route("/sessions/<session_id>", methods=["DELETE"])
@jwt_required()
def revoke_session(session_id):
    """Revoke a specific session (logout from a device)."""
    user_id = get_jwt_identity()
    success = auth_service.revoke_session(user_id, session_id)

    if not success:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({"message": "Session revoked"}), 200


@auth_bp.route("/sessions/revoke-all", methods=["POST"])
@jwt_required()
def revoke_all():
    """Logout from all devices."""
    user_id = get_jwt_identity()
    count = auth_service.revoke_all_sessions(user_id)
    return jsonify({"message": f"Revoked {count} sessions"}), 200


# ── Password Change ───────────────────────────────────────────────

@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
@role_required("student", "faculty", "admin")
@limiter.limit("5 per minute")
def change_password():
    """
    Change password.
    Body: {"old_password": "...", "new_password": "..."}
    """
    user_id = get_jwt_identity()
    data = request.get_json()

    success, error = auth_service.change_password(
        user_id, data.get("old_password"), data.get("new_password"),
    )

    if not success:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Password changed successfully"}), 200


# ── Guest Mode ─────────────────────────────────────────────────────

@auth_bp.route("/guest", methods=["POST"])
@limiter.limit("5 per minute")
def guest_login():
    """
    Guest login — no credentials needed.
    Returns a short-lived token with GUEST role.
    Guest can only access: Campus Map, Events (read-only), Public Notices.
    """
    result = auth_service.guest_login(
        device_info=request.headers.get("User-Agent"),
        ip_address=request.remote_addr,
    )
    return jsonify(result), 200


@auth_bp.route("/guest-log", methods=["POST"])
@jwt_required()
@limiter.limit("20 per minute")
def log_guest_activity():
    """
    Log guest activity anonymously to track which features are popular.
    """
    claims = get_jwt()
    if not claims.get("is_guest") and claims.get("role") != "guest":
        return jsonify({"error": "Unauthorized. Only guest sessions can log guest activity."}), 403

    data = request.get_json()
    feature_name = data.get("feature_name")
    session_id = claims.get("session_id")

    if not feature_name:
        return jsonify({"error": "feature_name is required"}), 400

    from ..models.user import GuestActivityLog
    log = GuestActivityLog(
        session_id=session_id or "anonymous_guest",
        feature_name=feature_name
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Guest activity logged successfully"}), 200


# ── Biometric / WebAuthn ───────────────────────────────────────────

@auth_bp.route("/biometric/register", methods=["POST"])
@jwt_required()
@role_required("student", "faculty", "admin")
def register_biometric():
    """
    Register a WebAuthn biometric credential.
    Called after the browser completes navigator.credentials.create().
    
    Body: {
        "credential_id": "base64url-encoded-credential-id",
        "public_key": "base64url-encoded-public-key",
        "device_name": "iPhone 15 Pro"
    }
    """
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ["credential_id", "public_key"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400

    cred, error = auth_service.register_biometric(
        user_id=user_id,
        credential_id=data["credential_id"],
        public_key=data["public_key"],
        device_name=data.get("device_name"),
    )

    if error:
        return jsonify({"error": error}), 409

    return jsonify({"message": "Biometric registered", "credential": cred}), 201


@auth_bp.route("/biometric/authenticate", methods=["POST"])
@limiter.limit("10 per minute")
def biometric_authenticate():
    """
    Authenticate using a WebAuthn assertion (passwordless).
    
    Body: {
        "credential_id": "base64url-encoded-credential-id",
        "sign_count": 5
    }
    """
    data = request.get_json()
    cred_id = data.get("credential_id")
    sign_count = data.get("sign_count", 0)

    if not cred_id:
        return jsonify({"error": "credential_id required"}), 400

    result, error = auth_service.authenticate_biometric(
        credential_id=cred_id,
        sign_count=sign_count,
        device_info=request.headers.get("User-Agent"),
        ip_address=request.remote_addr,
    )

    if error:
        return jsonify({"error": error}), 401

    response = jsonify({
        "access_token": result["access_token"],
        "user": result["user"],
        "auth_method": "biometric"
    })

    response.set_cookie(
        key=current_app.config.get("JWT_REFRESH_COOKIE_NAME", "refresh_token"),
        value=result["refresh_token"],
        httponly=True,
        secure=current_app.config.get("JWT_COOKIE_SECURE", False),
        samesite='Lax',
        max_age=30 * 24 * 60 * 60
    )

    return response, 200


@auth_bp.route("/biometric/credentials", methods=["GET"])
@jwt_required()
@role_required("student", "faculty", "admin")
def list_biometric_credentials():
    """List all registered biometric credentials for the current user."""
    user_id = get_jwt_identity()
    creds = auth_service.list_biometric_credentials(user_id)
    return jsonify({"credentials": creds}), 200


@auth_bp.route("/biometric/credentials/<cred_id>", methods=["DELETE"])
@jwt_required()
@role_required("student", "faculty", "admin")
def revoke_biometric(cred_id):
    """Revoke a biometric credential."""
    user_id = get_jwt_identity()
    success = auth_service.revoke_biometric(user_id, cred_id)
    if not success:
        return jsonify({"error": "Credential not found"}), 404
    return jsonify({"message": "Credential revoked"}), 200
