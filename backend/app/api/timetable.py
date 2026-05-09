"""
Timetable API
==============
Endpoints for timetable viewing, creation, and management.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..services.timetable_service import TimetableService
from ..middleware.auth_middleware import role_required

timetable_bp = Blueprint("timetable", __name__)
timetable_service = TimetableService()


@timetable_bp.route("/my-timetable", methods=["GET"])
@jwt_required()
@role_required("student")
def my_timetable():
    """Get timetable for logged-in student (Redis cached)."""
    from ..repositories.user_repo import UserRepository
    user = UserRepository().get_by_id(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404
    if not all([user.department, user.semester, user.section]):
        return jsonify({"error": "Profile incomplete"}), 400
    day = request.args.get("day")
    result, error = timetable_service.get_student_timetable(
        user.department, user.semester, user.section, day)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(result), 200


@timetable_bp.route("/class", methods=["GET"])
@jwt_required()
def class_timetable():
    """Get timetable for any class. Params: department, semester, section, day."""
    dept = request.args.get("department")
    sem = request.args.get("semester", type=int)
    sec = request.args.get("section")
    if not all([dept, sem, sec]):
        return jsonify({"error": "department, semester, section required"}), 400
    result, error = timetable_service.get_student_timetable(dept, sem, sec, request.args.get("day"))
    if error:
        return jsonify({"error": error}), 404
    return jsonify(result), 200


@timetable_bp.route("/faculty", methods=["GET"])
@jwt_required()
@role_required("faculty", "admin")
def faculty_timetable():
    """Get timetable for logged-in faculty."""
    return jsonify(timetable_service.get_faculty_timetable(get_jwt_identity())), 200


@timetable_bp.route("/now", methods=["GET"])
@jwt_required()
@role_required("student")
def current_class():
    """Get current live / next upcoming class."""
    from ..repositories.user_repo import UserRepository
    user = UserRepository().get_by_id(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404
    result = timetable_service.get_current_class(user.department, user.semester, user.section)
    return jsonify(result or {"message": "No classes found"}), 200


@timetable_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_timetable():
    """Create master timetable (admin only)."""
    data = request.get_json()
    required = ["name", "department", "semester", "section", "academic_year"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400
    result, error = timetable_service.create_timetable(get_jwt_identity(), data)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Timetable created", "timetable": result}), 201


@timetable_bp.route("/<timetable_id>/slot", methods=["POST"])
@jwt_required()
@role_required("admin")
def add_slot(timetable_id):
    """Add slot with conflict detection (admin only)."""
    data = request.get_json()
    required = ["day", "period_number", "start_time", "end_time"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400
    result, error = timetable_service.add_slot(timetable_id, data)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Slot added", "slot": result}), 201


@timetable_bp.route("/<timetable_id>/publish", methods=["POST"])
@jwt_required()
@role_required("admin")
def publish_timetable(timetable_id):
    """Publish timetable for students."""
    success, error = timetable_service.publish_timetable(timetable_id)
    if not success:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Timetable published"}), 200
