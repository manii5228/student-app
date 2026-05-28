"""
Auth Middleware
================
Role-Based Access Control (RBAC) decorator.
Restricts endpoints to specific roles: student, faculty, admin.
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt


def role_required(*allowed_roles):
    """
    Decorator to restrict access based on user role.
    
    Usage:
        @role_required("admin")
        @role_required("faculty", "admin")
        @role_required("student")
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get("role", "")

            if user_role not in allowed_roles:
                return jsonify({
                    "error": "Access denied",
                    "message": f"This endpoint requires one of: {', '.join(allowed_roles)}",
                    "your_role": user_role,
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def resolve_student_identity(user_id):
    """
    If the user_id is a transient guest ID, resolve it to student1's database ID
    so the guest can view mock student records.
    """
    if isinstance(user_id, str) and user_id.startswith("guest_"):
        from ..models.user import User
        student = User.query.filter_by(email="student1@veltech.edu.in").first()
        if student:
            return student.id
    return user_id
