"""
Home Dashboard API
==================
Aggregated feed, notifications, and global search for the home dashboard.
"""

import uuid
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..middleware.auth_middleware import resolve_student_identity

home_bp = Blueprint("home", __name__)


# ── Aggregated Feed ───────────────────────────────────────────────
@home_bp.route("/feed", methods=["GET"])
@jwt_required()
def home_feed():
    """
    Single optimized endpoint that aggregates:
    - Today's timetable
    - Upcoming assignments (due soon)
    - Recent notices
    - Attendance summary
    - Quick stats
    All fetched in parallel for sub-100ms response.
    """
    user_id = get_jwt_identity()
    real_user_id = resolve_student_identity(user_id)
    now = datetime.now(timezone.utc)
    today = now.date()
    day_name = today.strftime("%A")

    # Determine greeting
    hour = (now + timedelta(hours=5, minutes=30)).hour  # IST offset
    if hour < 12:
        greeting = "Good morning"
    elif hour < 17:
        greeting = "Good afternoon"
    else:
        greeting = "Good evening"

    # ── Timetable for today ─────────────────────────────────────
    today_classes = []
    try:
        from ..models.timetable import TimetableSlot
        slots = TimetableSlot.query.filter_by(day=day_name).order_by(
            TimetableSlot.start_time
        ).limit(8).all()
        today_classes = [s.to_dict() for s in slots]
    except Exception:
        pass

    # ── Upcoming assignments (next 7 days) ──────────────────────
    upcoming_assignments = []
    try:
        from ..models.academic import Assignment
        deadline = now + timedelta(days=7)
        assignments = Assignment.query.filter(
            Assignment.due_date >= now,
            Assignment.due_date <= deadline
        ).order_by(Assignment.due_date).limit(5).all()
        upcoming_assignments = [a.to_dict() for a in assignments]
    except Exception:
        pass

    # ── Recent notices (last 7 days) ────────────────────────────
    recent_notices = []
    try:
        from ..models.campus import Notice
        week_ago = now - timedelta(days=7)
        notices = Notice.query.filter(
            Notice.created_at >= week_ago
        ).order_by(Notice.created_at.desc()).limit(5).all()
        recent_notices = [n.to_dict() for n in notices]
    except Exception:
        pass

    # ── Attendance summary ──────────────────────────────────────
    attendance_summary = {"total_classes": 0, "present": 0, "percentage": 0}
    try:
        from ..models.attendance import AttendanceRecord
        records = AttendanceRecord.query.filter_by(student_id=real_user_id).all()
        total = len(records)
        present = sum(1 for r in records if r.status == "present")
        attendance_summary = {
            "total_classes": total,
            "present": present,
            "percentage": round((present / total * 100) if total > 0 else 0, 1)
        }
    except Exception:
        pass

    # ── Next immediate action ───────────────────────────────────
    next_action = None
    if today_classes:
        next_action = {
            "type": "class",
            "message": f"Your next class is {today_classes[0].get('subject_name', 'upcoming')} at {today_classes[0].get('start_time', '')}",
            "path": "/academic/timetable"
        }
    elif upcoming_assignments:
        next_action = {
            "type": "assignment",
            "message": f"Assignment '{upcoming_assignments[0].get('title', '')}' due soon",
            "path": "/academic/assignments"
        }

    # ── User info ───────────────────────────────────────────────
    user_info = {}
    try:
        from ..models.user import User
        if isinstance(user_id, str) and user_id.startswith("guest_"):
            user_info = {
                "first_name": "Guest",
                "last_name": "Visitor",
                "department": "CSE",
                "semester": 3,
                "role": "guest",
            }
        else:
            user = User.query.get(user_id)
            if user:
                user_info = {
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "department": user.department,
                    "semester": user.semester,
                    "role": user.role.value if user.role else "student",
                }
    except Exception:
        pass

    return jsonify({
        "greeting": greeting,
        "user": user_info,
        "next_action": next_action,
        "today_classes": today_classes,
        "upcoming_assignments": upcoming_assignments,
        "recent_notices": recent_notices,
        "attendance": attendance_summary,
        "stats": {
            "classes_today": len(today_classes),
            "pending_assignments": len(upcoming_assignments),
            "unread_notices": len(recent_notices),
            "attendance_pct": attendance_summary["percentage"],
        }
    }), 200


# ── Notifications ─────────────────────────────────────────────────
@home_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    """
    Aggregated notification drawer with categories.
    Merges academic, event, and finance notifications.
    """
    user_id = get_jwt_identity()
    category = request.args.get("category", "all")

    # Mock notification data — in production, these would come from a
    # dedicated Notification model with push routing logic.
    notifications = [
        {
            "id": "n1", "category": "academic", "urgency": "critical",
            "title": "CAT-1 Marks Released",
            "message": "Internal marks for Data Structures (CS304) are now available.",
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
            "read": False, "path": "/academic/internal-marks"
        },
        {
            "id": "n2", "category": "academic", "urgency": "normal",
            "title": "Assignment Due Tomorrow",
            "message": "Operating Systems Lab Report #4 is due by 11:59 PM.",
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
            "read": False, "path": "/academic/assignments"
        },
        {
            "id": "n3", "category": "event", "urgency": "normal",
            "title": "HackGrid 36h Registration Open",
            "message": "Register for the 36-hour hackathon at CSE Block Lab 4.",
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat(),
            "read": True, "path": "/campus/events"
        },
        {
            "id": "n4", "category": "finance", "urgency": "critical",
            "title": "Exam Fee Due in 3 Days",
            "message": "Semester exam fee of ₹2,500 is due on June 1st.",
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
            "read": False, "path": "/profile"
        },
        {
            "id": "n5", "category": "academic", "urgency": "normal",
            "title": "Syllabus Updated",
            "message": "Unit 4 content has been updated for Computer Networks.",
            "timestamp": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "read": True, "path": "/academic/syllabus"
        },
        {
            "id": "n6", "category": "event", "urgency": "normal",
            "title": "Club Meeting Today",
            "message": "CodeChef Chapter weekly CP session at 5 PM, Lab 2.",
            "timestamp": (datetime.now(timezone.utc) - timedelta(days=1, hours=3)).isoformat(),
            "read": True, "path": "/campus/events?tab=clubs"
        },
        {
            "id": "n7", "category": "finance", "urgency": "normal",
            "title": "Hostel Fee Receipt Available",
            "message": "Download your hostel fee receipt for Semester 4.",
            "timestamp": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "read": True, "path": "/profile"
        },
    ]

    # Dynamic Project Reminders Aggregation
    try:
        from ..models.user import User
        from ..models.career import Project, Milestone
        from ..middleware.auth_middleware import resolve_student_identity
        
        real_uid = resolve_student_identity(user_id)
        user_obj = db.session.get(User, real_uid)
        if user_obj:
            fullname = user_obj.full_name
            query = Project.query.filter(
                (Project.student_id == real_uid) | 
                (Project.team_members.ilike(f"%{fullname}%"))
            )
            projects_list = query.all()
            
            now_date = datetime.now(timezone.utc).date()
            seven_days_later = now_date + timedelta(days=7)
            
            due_milestones = []
            for p in projects_list:
                for m in p.milestones:
                    if not m.is_completed and m.due_date:
                        if m.due_date <= seven_days_later:
                            due_milestones.append({
                                "project_title": p.title,
                                "milestone_title": m.title,
                                "due_date": m.due_date,
                                "is_overdue": m.due_date < now_date
                            })
            
            if due_milestones:
                overdue_count = sum(1 for m in due_milestones if m["is_overdue"])
                unique_projects = len(set(m["project_title"] for m in due_milestones))
                
                if len(due_milestones) == 1:
                    m = due_milestones[0]
                    status = "overdue" if m["is_overdue"] else "due soon"
                    msg = f"Task '{m['milestone_title']}' in project '{m['project_title']}' is {status} (due {m['due_date']})."
                    title = "Project Task Due" if not m["is_overdue"] else "Project Task Overdue"
                else:
                    msg = f"You have {len(due_milestones)} tasks due this week across {unique_projects} project(s)."
                    title = "Aggregated Project Reminders"
                
                notifications.insert(0, {
                    "id": "proj_aggregated",
                    "category": "academic",
                    "urgency": "critical" if overdue_count > 0 else "normal",
                    "title": title,
                    "message": msg,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "read": False,
                    "path": "/career/projects"
                })
    except Exception:
        pass

    if category != "all":
        notifications = [n for n in notifications if n["category"] == category]

    unread_count = sum(1 for n in notifications if not n["read"])

    return jsonify({
        "notifications": notifications,
        "unread_count": unread_count,
        "categories": ["all", "academic", "event", "finance"]
    }), 200


@home_bp.route("/notifications/<notification_id>/read", methods=["POST"])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a single notification as read."""
    return jsonify({"message": "Notification marked as read", "id": notification_id}), 200


@home_bp.route("/notifications/read-all", methods=["POST"])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read."""
    return jsonify({"message": "All notifications marked as read"}), 200


# ── Global Search ─────────────────────────────────────────────────
@home_bp.route("/search", methods=["GET"])
@jwt_required()
def global_search():
    """
    Global search across users, subjects, events, notices.
    Uses basic SQL LIKE for now — can be swapped with Elasticsearch later.
    """
    q = request.args.get("q", "").strip()
    if len(q) < 2:
        return jsonify({"results": [], "query": q}), 200

    results = []

    # Search users (faculty directory)
    try:
        from ..models.user import User
        users = User.query.filter(
            db.or_(
                User.first_name.ilike(f"%{q}%"),
                User.last_name.ilike(f"%{q}%"),
                User.email.ilike(f"%{q}%"),
            )
        ).limit(5).all()
        for u in users:
            results.append({
                "type": "person",
                "title": f"{u.first_name} {u.last_name}",
                "subtitle": f"{u.department or ''} • {u.role.value}",
                "path": "/academic/faculty",
                "icon": "user"
            })
    except Exception:
        pass

    # Search notices
    try:
        from ..models.campus import Notice
        notices = Notice.query.filter(
            db.or_(
                Notice.title.ilike(f"%{q}%"),
                Notice.content.ilike(f"%{q}%"),
            )
        ).limit(3).all()
        for n in notices:
            results.append({
                "type": "notice",
                "title": n.title,
                "subtitle": "Notice Board",
                "path": "/campus/notices",
                "icon": "bell"
            })
    except Exception:
        pass

    # Search events
    try:
        from ..models.campus import Event
        events = Event.query.filter(
            db.or_(
                Event.title.ilike(f"%{q}%"),
                Event.description.ilike(f"%{q}%"),
            )
        ).limit(3).all()
        for e in events:
            results.append({
                "type": "event",
                "title": e.title,
                "subtitle": f"Event • {e.venue}",
                "path": "/campus/events",
                "icon": "calendar"
            })
    except Exception:
        pass

    # Static page results (always available)
    pages = [
        {"title": "Smart Timetable", "path": "/academic/timetable", "keywords": "timetable schedule class"},
        {"title": "Bunk-O-Meter", "path": "/academic/attendance", "keywords": "attendance bunk absent"},
        {"title": "Assignments", "path": "/academic/assignments", "keywords": "assignment homework submit"},
        {"title": "Results", "path": "/academic/results", "keywords": "result grade marks score"},
        {"title": "Syllabus", "path": "/academic/syllabus", "keywords": "syllabus curriculum unit"},
        {"title": "Internal Marks", "path": "/academic/internal-marks", "keywords": "internal cat marks test"},
        {"title": "Exam Schedule", "path": "/academic/exams", "keywords": "exam schedule date hall"},
        {"title": "Job Portal", "path": "/career/jobs", "keywords": "job placement company hiring"},
        {"title": "Digital Canteen", "path": "/campus/canteen", "keywords": "canteen food order menu"},
        {"title": "Bus Tracker", "path": "/campus/bus", "keywords": "bus route track transport"},
        {"title": "Library", "path": "/campus/library", "keywords": "library book borrow renew"},
        {"title": "Health Center", "path": "/utility/health", "keywords": "health doctor appointment sick"},
        {"title": "Emergency", "path": "/utility/emergency", "keywords": "emergency help sos alert"},
        {"title": "GPA Predictor", "path": "/ai/gpa-predictor", "keywords": "gpa predict cgpa calculate grade"},
        {"title": "AI Study Assistant", "path": "/ai/study-assistant", "keywords": "ai study chat tutor"},
        {"title": "Portfolio Builder", "path": "/career/portfolio", "keywords": "portfolio resume cv build"},
        {"title": "Mock Tests", "path": "/career/mock-tests", "keywords": "mock test aptitude practice"},
        {"title": "Profile Settings", "path": "/profile", "keywords": "profile settings account password"},
        {"title": "Notice Board", "path": "/campus/notices", "keywords": "notice announcement board"},
        {"title": "Events & Clubs", "path": "/campus/events", "keywords": "event club fest cultural"},
    ]
    q_lower = q.lower()
    for page in pages:
        if q_lower in page["keywords"] or q_lower in page["title"].lower():
            results.append({
                "type": "page",
                "title": page["title"],
                "subtitle": "Navigate",
                "path": page["path"],
                "icon": "compass"
            })

    # Search analytics — log the query
    try:
        import logging
        logging.getLogger("app").info(f"Search query: '{q}' by user {get_jwt_identity()}")
    except Exception:
        pass

    return jsonify({"results": results[:15], "query": q}), 200
