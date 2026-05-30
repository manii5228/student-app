"""
Admin API
==========
Admin Command Center endpoints for user management,
system health, and audit logs.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..middleware.auth_middleware import role_required
from ..repositories.user_repo import UserRepository
from ..models.user import UserRole

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_users():
    """List all users with pagination and role filter."""
    repo = UserRepository()
    role = request.args.get("role")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    if role:
        result = repo.get_by_role(UserRole(role), page, per_page)
    else:
        result = repo.get_all(page, per_page)

    return jsonify({
        "users": [u.to_dict() for u in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "pages": result["pages"],
    }), 200


@admin_bp.route("/users/<user_id>", methods=["PUT"])
@jwt_required()
@role_required("admin")
def update_user(user_id):
    """Update a user's profile or status."""
    repo = UserRepository()
    data = request.get_json()
    user = repo.update(user_id, **data)
    if not user:
        return jsonify({"error": "User not found"}), 404
    repo.commit()
    return jsonify({"user": user.to_dict()}), 200


@admin_bp.route("/users/<user_id>/deactivate", methods=["POST"])
@jwt_required()
@role_required("admin")
def deactivate_user(user_id):
    """Deactivate a user account."""
    repo = UserRepository()
    user = repo.update(user_id, is_active=False)
    if not user:
        return jsonify({"error": "User not found"}), 404
    repo.commit()
    return jsonify({"message": f"User {user.email} deactivated"}), 200


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@role_required("admin")
def system_stats():
    """System overview stats."""
    repo = UserRepository()
    return jsonify({
        "total_users": repo.count(),
        "students": repo.count(role=UserRole.STUDENT),
        "faculty": repo.count(role=UserRole.FACULTY),
        "admins": repo.count(role=UserRole.ADMIN),
        "active_users": repo.count(is_active=True),
    }), 200


@admin_bp.route("/assignments/<faculty_id>", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_faculty_assignments_admin(faculty_id):
    from ..models.user import CoordinatorAssignment
    from ..models.campus import Club
    assignments = CoordinatorAssignment.query.filter_by(faculty_id=faculty_id).all()
    assigned_features = [a.feature_key for a in assignments]
    
    # Query clubs advisor matches
    clubs = Club.query.filter_by(faculty_advisor_id=faculty_id).all()
    assigned_clubs = [c.id for c in clubs]
    
    return jsonify({
        "assigned_features": assigned_features,
        "assigned_clubs": assigned_clubs
    }), 200


@admin_bp.route("/assignments/<faculty_id>", methods=["PUT"])
@jwt_required()
@role_required("admin")
def update_faculty_assignments_admin(faculty_id):
    from ..models.user import CoordinatorAssignment
    from ..models.campus import Club
    data = request.get_json() or {}
    
    # 1. Overwrite coordinator feature_key assignments
    assigned_features = data.get("assigned_features", [])
    # Delete existing
    CoordinatorAssignment.query.filter_by(faculty_id=faculty_id).delete()
    
    # Add new
    for feature in assigned_features:
        a = CoordinatorAssignment(faculty_id=faculty_id, feature_key=feature)
        db.session.add(a)
        
    # 2. Overwrite club advisor assignments
    assigned_clubs = data.get("assigned_clubs", [])
    # Clear any clubs where this faculty was advisor
    existing_clubs = Club.query.filter_by(faculty_advisor_id=faculty_id).all()
    for c in existing_clubs:
        c.faculty_advisor_id = None
        
    # Set advisor for new clubs
    for club_id in assigned_clubs:
        c = db.session.get(Club, club_id)
        if c:
            c.faculty_advisor_id = faculty_id
            
    db.session.commit()
    
    return jsonify({
        "message": "Assignments updated successfully",
        "assigned_features": assigned_features,
        "assigned_clubs": assigned_clubs
    }), 200
