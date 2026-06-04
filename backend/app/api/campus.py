"""
Campus API — Canteen, Bus Tracking, Library, Events, Notices, Clubs, Feedback, Marketplace
"""

import json
import secrets
from datetime import datetime, timezone, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..middleware.auth_middleware import role_required
from ..models.campus import (
    CanteenItem, CanteenOrder, Bus, LibraryBook, LibraryIssue,
    Event, EventRegistration, Notice, Club, ClubMembership,
    Feedback, MarketListing, HostelPass, ScannedDocument
)

campus_bp = Blueprint("campus", __name__)


# ── Digital Canteen ────────────────────────────────────────────────

@campus_bp.route("/canteen/menu", methods=["GET"])
@jwt_required()
def canteen_menu():
    """Browse canteen menu with category filter."""
    cat = request.args.get("category")
    query = CanteenItem.query.filter_by(is_available=True)
    if cat:
        query = query.filter_by(category=cat)
    items = query.order_by(CanteenItem.category, CanteenItem.name).all()
    return jsonify({"menu": [i.to_dict() for i in items]}), 200


@campus_bp.route("/canteen/order", methods=["POST"])
@jwt_required()
@role_required("student")
def place_order():
    """Pre-order food to skip lines."""
    data = request.get_json()
    order = CanteenOrder(
        student_id=get_jwt_identity(),
        items_json=json.dumps(data["items"]),
        total_amount=data["total_amount"],
        order_number=f"ORD{secrets.randbelow(9999):04d}",
    )
    db.session.add(order)
    db.session.commit()
    return jsonify({"message": "Order placed", "order": order.to_dict()}), 201


@campus_bp.route("/canteen/orders", methods=["GET"])
@jwt_required()
def my_orders():
    """Get student's canteen orders."""
    orders = CanteenOrder.query.filter_by(student_id=get_jwt_identity())\
        .order_by(CanteenOrder.created_at.desc()).limit(20).all()
    return jsonify({"orders": [o.to_dict() for o in orders]}), 200


@campus_bp.route("/canteen/order/<oid>/status", methods=["PUT"])
@jwt_required()
@role_required("admin", "faculty")
def update_order_status(oid):
    """Update order status (admin/canteen staff)."""
    order = db.session.get(CanteenOrder, oid)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    order.status = request.get_json().get("status", order.status)
    db.session.commit()
    return jsonify({"order": order.to_dict()}), 200


# ── Bus Tracking ───────────────────────────────────────────────────

@campus_bp.route("/buses", methods=["GET"])
@jwt_required()
def list_buses():
    """Get all active buses."""
    buses = Bus.query.filter_by(is_active=True).all()
    return jsonify({"buses": [b.to_dict() for b in buses]}), 200


@campus_bp.route("/buses/live", methods=["GET"])
@jwt_required()
def list_live_buses():
    """Simulated Live Bus Tracking for Hostellers."""
    import time
    import math
    # VelTech coords: 13.1818, 80.0401
    
    # Leaders: 13.1850, 80.0350
    # Princes: 13.1900, 80.0300
    # Kings: 13.1800, 80.0450

    t = time.time()
    # Math magic to simulate back and forth movement between college and hostel
    def get_pos(start, end, offset, speed_factor):
        cycle = (t * speed_factor + offset) % 200
        progress = cycle / 100.0 if cycle < 100 else (200 - cycle) / 100.0
        lat = start[0] + (end[0] - start[0]) * progress
        lng = start[1] + (end[1] - start[1]) * progress
        return lat, lng

    live_data = [
        {"id": "b1", "bus_number": "L-1", "route_name": "Leaders Hostel", "type": "Leaders", "position": get_pos((13.1818, 80.0401), (13.1850, 80.0350), 0, 0.5), "next_stop": "College Gate", "eta": "2 mins"},
        {"id": "b2", "bus_number": "L-2", "route_name": "Leaders Hostel", "type": "Leaders", "position": get_pos((13.1818, 80.0401), (13.1850, 80.0350), 50, 0.5), "next_stop": "Leaders Hostel", "eta": "5 mins"},
        {"id": "b3", "bus_number": "P-1", "route_name": "Princes Hostel", "type": "Princes", "position": get_pos((13.1818, 80.0401), (13.1900, 80.0300), 20, 0.3), "next_stop": "Princes Hostel", "eta": "10 mins"},
        {"id": "b4", "bus_number": "K-1", "route_name": "Kings Hostel", "type": "Kings", "position": get_pos((13.1818, 80.0401), (13.1800, 80.0450), 70, 0.2), "next_stop": "College Gate", "eta": "15 mins"}
    ]
    return jsonify({"buses": live_data}), 200


@campus_bp.route("/buses/<bid>/location", methods=["PUT"])
@jwt_required()
@role_required("admin")
def update_bus_location(bid):
    """Update bus GPS coordinates."""
    bus = db.session.get(Bus, bid)
    if not bus:
        return jsonify({"error": "Bus not found"}), 404
    data = request.get_json()
    bus.current_lat = data.get("lat")
    bus.current_lng = data.get("lng")
    bus.last_updated = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"bus": bus.to_dict()}), 200


# ── Library ────────────────────────────────────────────────────────

@campus_bp.route("/library/books", methods=["GET"])
@jwt_required()
def search_books():
    """Search library books."""
    q = request.args.get("q", "")
    cat = request.args.get("category")
    query = LibraryBook.query
    if q:
        s = f"%{q}%"
        query = query.filter(LibraryBook.title.ilike(s) | LibraryBook.author.ilike(s))
    if cat:
        query = query.filter_by(category=cat)
    books = query.limit(50).all()
    return jsonify({"books": [b.to_dict() for b in books]}), 200


# Library My Issues and Renewals endpoints have been removed per requirements


# ── Events ─────────────────────────────────────────────────────────

@campus_bp.route("/events", methods=["GET"])
@jwt_required()
def list_events():
    """Discovery feed for fests and events."""
    etype = request.args.get("type")
    pending = request.args.get("pending")  # Admin: fetch unapproved events
    if pending == "true":
        query = Event.query.filter_by(is_approved=False)
    else:
        query = Event.query.filter_by(is_approved=True)
    if etype:
        query = query.filter_by(event_type=etype)
    events = query.order_by(Event.start_date.desc()).limit(50).all()
    return jsonify({"events": [e.to_dict() for e in events]}), 200


@campus_bp.route("/events", methods=["POST"])
@jwt_required()
def create_event():
    """Create an event (requires admin approval, unless created by faculty/admin)."""
    return jsonify({"error": "Event creation is currently disabled."}), 403
    data = request.get_json()
    creator_id = get_jwt_identity()
    from ..models.user import User
    creator = db.session.get(User, creator_id)
    is_approved = False
    if creator and creator.role.value in ("faculty", "admin"):
        is_approved = True

    e = Event(
        title=data["title"], description=data.get("description"),
        event_type=data.get("event_type", "fest"),
        organizer_id=creator_id, venue=data.get("venue"),
        start_date=datetime.fromisoformat(data["start_date"].replace("Z", "+00:00")),
        end_date=datetime.fromisoformat(data["end_date"].replace("Z", "+00:00")) if data.get("end_date") else None,
        max_participants=data.get("max_participants"),
        is_approved=is_approved,
        badge_id=data.get("badge_id")
    )
    db.session.add(e)
    db.session.commit()
    msg = "Event created and published" if is_approved else "Event submitted for approval"
    return jsonify({"message": msg, "event": e.to_dict()}), 201


@campus_bp.route("/events/<eid>", methods=["PUT"])
@jwt_required()
def edit_event(eid):
    """Edit event details (organizer or admin only)."""
    event = db.session.get(Event, eid)
    if not event:
        return jsonify({"error": "Event not found"}), 404
        
    current_user_id = get_jwt_identity()
    from ..models.user import User
    current_user = db.session.get(User, current_user_id)
    
    if event.organizer_id != current_user_id and current_user.role.value != "admin":
        return jsonify({"error": "Not authorized to edit this event"}), 403
        
    data = request.get_json()
    if "title" in data:
        event.title = data["title"]
    if "description" in data:
        event.description = data["description"]
    if "event_type" in data:
        event.event_type = data["event_type"]
    if "venue" in data:
        event.venue = data["venue"]
    if "start_date" in data:
        event.start_date = datetime.fromisoformat(data["start_date"].replace("Z", "+00:00"))
    if "end_date" in data:
        event.end_date = datetime.fromisoformat(data["end_date"].replace("Z", "+00:00")) if data["end_date"] else None
    if "max_participants" in data:
        event.max_participants = data["max_participants"]
    if "results" in data:
        event.results = data["results"]
    if "badge_id" in data:
        event.badge_id = data["badge_id"]
        
    db.session.commit()
    return jsonify({"message": "Event updated successfully", "event": event.to_dict()}), 200


@campus_bp.route("/events/<eid>", methods=["DELETE"])
@jwt_required()
def delete_event(eid):
    """Delete event (organizer or admin only)."""
    event = db.session.get(Event, eid)
    if not event:
        return jsonify({"error": "Event not found"}), 404
        
    current_user_id = get_jwt_identity()
    from ..models.user import User
    current_user = db.session.get(User, current_user_id)
    
    if event.organizer_id != current_user_id and current_user.role.value != "admin":
        return jsonify({"error": "Not authorized to delete this event"}), 403
        
    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": "Event deleted successfully"}), 200


@campus_bp.route("/events/<eid>/registrations", methods=["GET"])
@jwt_required()
def get_event_registrations(eid):
    """Get registrations for an event (organizer or admin only)."""
    event = db.session.get(Event, eid)
    if not event:
        return jsonify({"error": "Event not found"}), 404
        
    current_user_id = get_jwt_identity()
    from ..models.user import User
    current_user = db.session.get(User, current_user_id)
    
    if event.organizer_id != current_user_id and current_user.role.value != "admin":
        return jsonify({"error": "Not authorized"}), 403
        
    registrations = EventRegistration.query.filter_by(event_id=eid).all()
    res = []
    for r in registrations:
        student = db.session.get(User, r.student_id)
        d = r.to_dict()
        if student:
            d["student_name"] = student.full_name
            d["student_roll"] = student.roll_number
            d["student_email"] = student.email
        res.append(d)
    return jsonify({"registrations": res}), 200


@campus_bp.route("/events/<eid>/registrations/<rid>", methods=["PUT"])
@jwt_required()
def update_event_registration(eid, rid):
    """Approve/reject/grade a student registration, and award associated badge if attended/winner."""
    event = db.session.get(Event, eid)
    if not event:
        return jsonify({"error": "Event not found"}), 404
        
    current_user_id = get_jwt_identity()
    from ..models.user import User
    current_user = db.session.get(User, current_user_id)
    
    if event.organizer_id != current_user_id and current_user.role.value != "admin":
        return jsonify({"error": "Not authorized"}), 403
        
    reg = db.session.get(EventRegistration, rid)
    if not reg or reg.event_id != eid:
        return jsonify({"error": "Registration not found"}), 404
        
    data = request.get_json()
    new_status = data.get("status") # pending, approved, rejected, attended, winner
    if not new_status:
        return jsonify({"error": "status is required"}), 400
        
    reg.status = new_status
    
    # Auto-award associated badge if status is 'attended' or 'winner'
    if new_status in ("attended", "winner") and event.badge_id:
        from ..models.career import EarnedBadge
        # Check if student already has this badge
        existing_badge = EarnedBadge.query.filter_by(
            student_id=reg.student_id, badge_id=event.badge_id
        ).first()
        if not existing_badge:
            eb = EarnedBadge(
                student_id=reg.student_id,
                badge_id=event.badge_id,
                awarded_by=current_user_id,
                note=f"Awarded for participating in event '{event.title}' as {new_status}.",
                status="approved"
            )
            db.session.add(eb)
            
    db.session.commit()
    return jsonify({"message": "Registration updated", "registration": reg.to_dict()}), 200


@campus_bp.route("/events/<eid>/register", methods=["POST"])
@jwt_required()
@role_required("student")
def register_event(eid):
    """Register for an event (with duplicate check)."""
    return jsonify({"error": "Event registration is currently disabled."}), 403
    student_id = get_jwt_identity()
    existing = EventRegistration.query.filter_by(
        event_id=eid, student_id=student_id).first()
    if existing:
        return jsonify({"message": "Already registered"}), 200
    data = request.get_json() or {}
    reg = EventRegistration(
        event_id=eid, student_id=student_id,
        role=data.get("role", "participant"),
        status="pending"
    )
    db.session.add(reg)
    event = db.session.get(Event, eid)
    if event:
        event.registration_count = (event.registration_count or 0) + 1
    db.session.commit()
    return jsonify({"message": "Registered"}), 201


@campus_bp.route("/events/my-registrations", methods=["GET"])
@jwt_required()
def my_event_registrations():
    """Get event IDs the current user has registered for."""
    regs = EventRegistration.query.filter_by(
        student_id=get_jwt_identity()).all()
    event_ids = [r.event_id for r in regs]
    return jsonify({"event_ids": event_ids}), 200


@campus_bp.route("/events/<eid>/approve", methods=["POST"])
@jwt_required()
@role_required("admin")
def approve_event(eid):
    """Admin approves an event."""
    event = db.session.get(Event, eid)
    if not event:
        return jsonify({"error": "Event not found"}), 404
    event.is_approved = True
    db.session.commit()
    return jsonify({"message": "Event approved"}), 200


@campus_bp.route("/events/<eid>/reject", methods=["POST"])
@jwt_required()
@role_required("admin")
def reject_event(eid):
    """Admin rejects an event (deletes it)."""
    event = db.session.get(Event, eid)
    if not event:
        return jsonify({"error": "Event not found"}), 404
    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": "Event rejected and removed"}), 200


# ── Notice Board ───────────────────────────────────────────────────

@campus_bp.route("/notices", methods=["GET"])
@jwt_required(optional=True)
def list_notices():
    """Get notice board with pinned items first. Filter by student audience if logged in."""
    from ..models.user import User
    from sqlalchemy import or_, and_
    
    current_user = get_jwt_identity()
    student = db.session.get(User, current_user) if current_user else None
    
    query = Notice.query
    
    # If the logged-in user is a student, filter targeted notices with graceful fallbacks
    if student and student.role.value == "student":
        query = query.filter(
            or_(
                Notice.target_audience == "all",
                and_(
                    or_(Notice.branch == None, Notice.branch == '', Notice.branch == student.department, student.department == None, student.department == ''),
                    or_(Notice.year == None, Notice.year == student.semester, student.semester == None),
                    or_(Notice.section == None, Notice.section == '', Notice.section == student.section, student.section == None, student.section == '')
                )
            )
        )
        
    notices = query.order_by(Notice.is_pinned.desc(), Notice.created_at.desc()).limit(50).all()
    
    notice_list = []
    for n in notices:
        n_dict = n.to_dict()
        n_dict["read_count"] = n.reads.count()
        if current_user:
            n_dict["is_read"] = n.reads.filter_by(user_id=current_user).first() is not None
        else:
            n_dict["is_read"] = False
        notice_list.append(n_dict)
        
    return jsonify({"notices": notice_list}), 200

@campus_bp.route("/notices/<nid>/read", methods=["POST"])
@jwt_required()
def mark_notice_read(nid):
    """Mark a notice as read by the current user."""
    from ..models.campus import NoticeRead
    current_user = get_jwt_identity()
    
    notice = db.session.get(Notice, nid)
    if not notice:
        return jsonify({"error": "Notice not found"}), 404
        
    existing = NoticeRead.query.filter_by(notice_id=nid, user_id=current_user).first()
    if not existing:
        nr = NoticeRead(notice_id=nid, user_id=current_user)
        db.session.add(nr)
        db.session.commit()
        
    return jsonify({"message": "Marked as read"}), 200


@campus_bp.route("/notices", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def create_notice():
    """Post a notice/announcement."""
    data = request.get_json()
    n = Notice(
        title=data["title"], content=data["content"],
        author_id=get_jwt_identity(),
        priority=data.get("priority", "normal"),
        target_audience=data.get("target_audience", "all"),
        is_pinned=data.get("is_pinned", False),
        branch=data.get("branch"),
        year=data.get("year"),
        section=data.get("section"),
        media_json=json.dumps(data.get("media", [])),
        files_json=json.dumps(data.get("files", []))
    )
    db.session.add(n)
    db.session.commit()
    return jsonify({"message": "Notice posted", "notice": n.to_dict()}), 201


@campus_bp.route("/notices/<nid>", methods=["PUT"])
@jwt_required()
@role_required("faculty", "admin")
def update_notice(nid):
    """Edit a notice after publishing. Only the author can edit it."""
    notice = db.session.get(Notice, nid)
    if not notice:
        return jsonify({"error": "Notice not found"}), 404
        
    current_user = get_jwt_identity()
    if notice.author_id != current_user:
        return jsonify({"error": "Forbidden: Only the original publisher can edit this notice"}), 403
        
    data = request.get_json()
    notice.title = data.get("title", notice.title)
    notice.content = data.get("content", notice.content)
    notice.priority = data.get("priority", notice.priority)
    notice.target_audience = data.get("target_audience", notice.target_audience)
    notice.is_pinned = data.get("is_pinned", notice.is_pinned)
    notice.branch = data.get("branch", notice.branch)
    notice.year = data.get("year", notice.year)
    notice.section = data.get("section", notice.section)
    if "media" in data:
        notice.media_json = json.dumps(data["media"])
    if "files" in data:
        notice.files_json = json.dumps(data["files"])
        
    db.session.commit()
    return jsonify({"message": "Notice updated successfully", "notice": notice.to_dict()}), 200


# ── Clubs & Societies ─────────────────────────────────────────────

@campus_bp.route("/clubs", methods=["GET"])
@jwt_required()
def list_clubs():
    """List all active clubs."""
    clubs = Club.query.filter_by(is_active=True).all()
    return jsonify({"clubs": [c.to_dict() for c in clubs]}), 200


@campus_bp.route("/clubs", methods=["POST"])
@jwt_required()
@role_required("faculty", "admin")
def create_club():
    """Create a new technical or non-technical club."""
    return jsonify({"error": "Club creation is currently disabled."}), 403
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")
    club_type = data.get("club_type", "technical") # technical / cultural / media etc.
    
    if not name:
        return jsonify({"error": "Club name is required"}), 400
        
    existing = Club.query.filter_by(name=name).first()
    if existing:
        return jsonify({"error": "Club name already exists"}), 400
        
    club = Club(
        name=name,
        description=description,
        club_type=club_type,
        faculty_advisor_id=get_jwt_identity(),
        is_active=True,
        member_count=0
    )
    db.session.add(club)
    db.session.commit()
    return jsonify({"message": "Club created successfully", "club": club.to_dict()}), 201


@campus_bp.route("/clubs/<cid>/join", methods=["POST"])
@jwt_required()
@role_required("student")
def join_club(cid):
    """Join a club (with duplicate check)."""
    return jsonify({"error": "Club join is currently disabled."}), 403
    student_id = get_jwt_identity()
    existing = ClubMembership.query.filter_by(
        club_id=cid, student_id=student_id).first()
    if existing:
        return jsonify({"message": "Already a member"}), 200
    mem = ClubMembership(club_id=cid, student_id=student_id)
    db.session.add(mem)
    club = db.session.get(Club, cid)
    if club:
        club.member_count = (club.member_count or 0) + 1
    db.session.commit()
    return jsonify({"message": "Joined club"}), 201


@campus_bp.route("/clubs/my-clubs", methods=["GET"])
@jwt_required()
@role_required("student", "faculty")
def my_clubs():
    """Get clubs the user has joined or advises."""
    current_user = get_jwt_identity()
    mems = ClubMembership.query.filter_by(student_id=current_user).all()
    club_ids = [m.club_id for m in mems]
    clubs = Club.query.filter(Club.id.in_(club_ids) | (Club.faculty_advisor_id == current_user)).all() if club_ids else Club.query.filter_by(faculty_advisor_id=current_user).all()
    return jsonify({"clubs": [c.to_dict() for c in set(clubs)]}), 200

@campus_bp.route("/clubs/<cid>/posts", methods=["GET"])
@jwt_required()
def get_club_posts(cid):
    """Get internal feed posts for a club."""
    from ..models.campus import ClubPost
    # Make sure user is a member or admin
    club = db.session.get(Club, cid)
    if not club:
        return jsonify({"error": "Club not found"}), 404
    posts = ClubPost.query.filter_by(club_id=cid).order_by(ClubPost.created_at.desc()).all()
    return jsonify({"posts": [p.to_dict() for p in posts]}), 200

@campus_bp.route("/clubs/<cid>/posts", methods=["POST"])
@jwt_required()
def create_club_post(cid):
    """Create a club post. Only president/faculty/admin."""
    return jsonify({"error": "Club posting is currently disabled."}), 403
    from ..models.campus import ClubPost
    club = db.session.get(Club, cid)
    if not club:
        return jsonify({"error": "Club not found"}), 404
        
    current_user = get_jwt_identity()
    # Basic check (in real app, use roles or membership status)
    
    data = request.get_json()
    post = ClubPost(
        club_id=cid, author_id=current_user,
        content=data["content"], image_url=data.get("image_url")
    )
    db.session.add(post)
    db.session.commit()
    return jsonify({"message": "Post created", "post": post.to_dict()}), 201

@campus_bp.route("/clubs/<cid>/attendance", methods=["POST"])
@jwt_required()
def record_club_attendance(cid):
    """Record attendance via QR scan."""
    return jsonify({"error": "Club attendance recording is currently disabled."}), 403
    from ..models.campus import ClubAttendance
    club = db.session.get(Club, cid)
    if not club:
        return jsonify({"error": "Club not found"}), 404
        
    data = request.get_json()
    student_id = get_jwt_identity()
    
    att = ClubAttendance(
        club_id=cid, student_id=student_id,
        event_title=data.get("event_title", "Regular Meeting"),
        hours=data.get("hours", 1.0)
    )
    db.session.add(att)
    db.session.commit()
    return jsonify({"message": "Attendance recorded"}), 201

@campus_bp.route("/clubs/<cid>/attendance", methods=["GET"])
@jwt_required()
def get_club_attendance(cid):
    """Get club attendance."""
    from ..models.campus import ClubAttendance
    att = ClubAttendance.query.filter_by(club_id=cid).all()
    return jsonify({"attendance": [a.to_dict() for a in att]}), 200

@campus_bp.route("/clubs/<cid>/president", methods=["PUT"])
@jwt_required()
@role_required("admin", "faculty")
def set_club_president(cid):
    """Assign club president."""
    club = db.session.get(Club, cid)
    if not club:
        return jsonify({"error": "Club not found"}), 404
    data = request.get_json()
    club.president_id = data.get("president_id")
    db.session.commit()
    return jsonify({"message": "President assigned", "club": club.to_dict()}), 200


@campus_bp.route("/clubs/<cid>", methods=["PUT"])
@jwt_required()
@role_required("admin", "faculty")
def update_club(cid):
    """Update club details including name, description, type, advisor, and president."""
    club = db.session.get(Club, cid)
    if not club:
        return jsonify({"error": "Club not found"}), 404
        
    current_user_id = get_jwt_identity()
    from ..models.user import User
    current_user = db.session.get(User, current_user_id)
    if club.faculty_advisor_id != current_user_id and current_user.role.value != "admin":
        return jsonify({"error": "Not authorized to edit this club"}), 403
        
    data = request.get_json()
    if "name" in data:
        name = data.get("name")
        if name != club.name:
            existing = Club.query.filter_by(name=name).first()
            if existing:
                return jsonify({"error": "Club name already exists"}), 400
            club.name = name
            
    if "description" in data:
        club.description = data.get("description")
    if "club_type" in data:
        club.club_type = data.get("club_type")
    if "faculty_advisor_id" in data:
        club.faculty_advisor_id = data.get("faculty_advisor_id")
    if "president_id" in data:
        club.president_id = data.get("president_id")
    if "website_url" in data:
        club.website_url = data.get("website_url")
    if "instagram_url" in data:
        club.instagram_url = data.get("instagram_url")
    if "linkedin_url" in data:
        club.linkedin_url = data.get("linkedin_url")
        
    db.session.commit()
    return jsonify({"message": "Club updated successfully", "club": club.to_dict()}), 200


@campus_bp.route("/clubs/<cid>", methods=["DELETE"])
@jwt_required()
@role_required("admin", "faculty")
def delete_club(cid):
    """Delete a club (requires admin/advisor role)."""
    club = db.session.get(Club, cid)
    if not club:
        return jsonify({"error": "Club not found"}), 404
        
    current_user_id = get_jwt_identity()
    from ..models.user import User
    current_user = db.session.get(User, current_user_id)
    if club.faculty_advisor_id != current_user_id and current_user.role.value != "admin":
        return jsonify({"error": "Not authorized to delete this club"}), 403
        
    db.session.delete(club)
    db.session.commit()
    return jsonify({"message": "Club deleted successfully"}), 200


# ── Anonymous Feedback ─────────────────────────────────────────────

@campus_bp.route("/feedback", methods=["GET"])
@jwt_required()
def list_feedback():
    """List feedback (public)."""
    feedbacks = Feedback.query.order_by(
        Feedback.upvotes.desc(), Feedback.created_at.desc()).limit(50).all()
    return jsonify({"feedbacks": [f.to_dict() for f in feedbacks]}), 200


@campus_bp.route("/feedback", methods=["POST"])
@jwt_required(optional=True)
def submit_feedback():
    """Submit anonymous or named feedback with sentiment and basic bad word filter."""
    import re
    data = request.get_json()
    
    content = data["content"]
    # Basic bad word filtering
    bad_words = ["fuck", "shit", "bitch", "asshole", "cunt", "dick"]
    pattern = re.compile(r'\b(' + '|'.join(bad_words) + r')\b', re.IGNORECASE)
    content = pattern.sub('***', content)
    
    current_user = get_jwt_identity()
    is_anonymous = data.get("is_anonymous", True)
    
    fb = Feedback(
        content=content, category=data.get("category", "general"),
        is_anonymous=is_anonymous,
        author_id=current_user if not is_anonymous else None,
        sentiment=data.get("sentiment", "neutral")
    )
    db.session.add(fb)
    db.session.commit()
    return jsonify({"message": "Feedback submitted"}), 201


@campus_bp.route("/feedback/<fid>/respond", methods=["POST"])
@jwt_required()
@role_required("admin")
def respond_feedback(fid):
    """Admin responds to feedback."""
    fb = db.session.get(Feedback, fid)
    if not fb:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json()
    fb.admin_response = data["response"]
    fb.status = "reviewed"
    db.session.commit()
    return jsonify({"message": "Response posted"}), 200


# ── Buy & Sell Marketplace ────────────────────────────────────────

@campus_bp.route("/marketplace", methods=["GET"])
@jwt_required()
def marketplace_listings():
    """Browse marketplace items."""
    cat = request.args.get("category")
    query = MarketListing.query.filter_by(is_sold=False)
    if cat:
        query = query.filter_by(category=cat)
    items = query.order_by(MarketListing.created_at.desc()).limit(50).all()
    return jsonify({"listings": [i.to_dict() for i in items]}), 200


@campus_bp.route("/marketplace", methods=["POST"])
@jwt_required()
@role_required("student")
def create_listing():
    """Post an item for sale."""
    data = request.get_json()
    listing = MarketListing(
        seller_id=get_jwt_identity(), title=data["title"],
        description=data.get("description"), price=data["price"],
        category=data.get("category", "books"),
        condition=data.get("condition", "good"),
    )
    db.session.add(listing)
    db.session.commit()
    return jsonify({"message": "Listed", "listing": listing.to_dict()}), 201


# ── Hostel Pass ────────────────────────────────────────────────
@campus_bp.route("/hostel-pass", methods=["GET"])
@jwt_required()
@role_required("student")
def my_hostel_passes():
    """Get all hostel passes for the logged in student."""
    passes = HostelPass.query.filter_by(student_id=get_jwt_identity()).order_by(HostelPass.created_at.desc()).all()
    return jsonify({"passes": [p.to_dict() for p in passes]}), 200

@campus_bp.route("/hostel-pass", methods=["POST"])
@jwt_required()
@role_required("student")
def request_hostel_pass():
    """Request a new hostel pass."""
    data = request.get_json()
    new_pass = HostelPass(
        student_id=get_jwt_identity(),
        reason=data["reason"],
        from_date=datetime.fromisoformat(data["from_date"].replace("Z", "+00:00")),
        to_date=datetime.fromisoformat(data["to_date"].replace("Z", "+00:00"))
    )
    db.session.add(new_pass)
    db.session.commit()
    return jsonify({"message": "Hostel pass requested successfully", "pass": new_pass.to_dict()}), 201

@campus_bp.route("/hostel-pass/mentees", methods=["GET"])
@jwt_required()
@role_required("faculty", "admin")
def get_mentees_hostel_passes():
    """Get hostel passes for the faculty's mentees."""
    from ..models.user import User, UserRole
    uid = get_jwt_identity()
    user = db.session.get(User, uid)
    if user.role == UserRole.ADMIN:
        passes = HostelPass.query.order_by(HostelPass.created_at.desc()).all()
    else:
        mentees = User.query.filter_by(mentor_id=uid, role=UserRole.STUDENT).all()
        mentee_ids = [m.id for m in mentees]
        passes = HostelPass.query.filter(HostelPass.student_id.in_(mentee_ids)).order_by(HostelPass.created_at.desc()).all()
    
    # attach student names
    pass_data = []
    for p in passes:
        d = p.to_dict()
        u = db.session.get(User, p.student_id)
        d['student_name'] = u.full_name if u else "Unknown"
        d['student_reg'] = u.roll_number if u else "N/A"
        pass_data.append(d)

    return jsonify({"passes": pass_data}), 200

@campus_bp.route("/hostel-pass/<pid>/status", methods=["PUT"])
@jwt_required()
@role_required("admin", "faculty")
def update_hostel_pass_status(pid):
    """Update status of a hostel pass by mentor/admin (approve/reject)."""
    h_pass = db.session.get(HostelPass, pid)
    if not h_pass:
        return jsonify({"error": "Hostel pass not found"}), 404
    
    data = request.get_json()
    status = data.get("status")
    if status in ["approved", "rejected"]:
        h_pass.mentor_status = status
        h_pass.status = status
        if status == "approved":
            h_pass.qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PASS-{h_pass.id}"
        db.session.commit()
        return jsonify({"message": f"Hostel pass status set to {status}", "pass": h_pass.to_dict()}), 200
    return jsonify({"error": "Invalid status"}), 400

@campus_bp.route("/hostel-pass/bulk-status", methods=["PUT"])
@jwt_required()
@role_required("admin", "faculty")
def bulk_update_hostel_pass_status():
    """Bulk update status of hostel passes by mentor/admin (approve/reject)."""
    data = request.get_json()
    pids = data.get("ids", [])
    status = data.get("status")
    if status not in ["approved", "rejected"]:
        return jsonify({"error": "Invalid status"}), 400
    
    passes = HostelPass.query.filter(HostelPass.id.in_(pids)).all()
    for h_pass in passes:
        h_pass.mentor_status = status
        h_pass.status = status
        if status == "approved":
            h_pass.qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PASS-{h_pass.id}"
            
    db.session.commit()
    return jsonify({"message": f"Successfully updated {len(passes)} passes status to {status}"}), 200


# ── Document Scanner Endpoints ─────────────────────────────────────

def cleanup_expired_documents():
    """Delete all scanned documents older than 5 minutes from DB and disk."""
    import os
    from datetime import datetime, timezone, timedelta
    from ..models.campus import ScannedDocument
    from ..extensions import db

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    expired = ScannedDocument.query.filter(ScannedDocument.created_at < cutoff).all()
    for doc in expired:
        try:
            if os.path.exists(doc.file_path):
                os.remove(doc.file_path)
            db.session.delete(doc)
        except Exception as e:
            print(f"Error cleaning up expired document {doc.id}: {e}")
    db.session.commit()


@campus_bp.route("/documents/scan", methods=["POST"])
@jwt_required()
def save_scanned_document():
    """Compile multiple base64 images into a single PDF, save it, and queue for deletion after 5 mins."""
    import os
    import base64
    import io
    import uuid
    from datetime import datetime, timezone
    from PIL import Image
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.utils import ImageReader
    from ..models.campus import ScannedDocument
    from ..extensions import db

    # First clean up any expired documents
    cleanup_expired_documents()

    data = request.get_json() or {}
    name = data.get("name")
    images_b64 = data.get("images", [])

    if not name or not images_b64:
        return jsonify({"error": "Name and images array are required."}), 400

    # Ensure uploads folder exists
    uploads_dir = os.path.join(current_app.instance_path, "scanned_documents")
    os.makedirs(uploads_dir, exist_ok=True)

    filename = f"scan_{uuid.uuid4().hex}.pdf"
    file_path = os.path.join(uploads_dir, filename)

    try:
        # Create PDF using ReportLab
        c = canvas.Canvas(file_path, pagesize=letter)
        width, height = letter

        for img_b64 in images_b64:
            if "," in img_b64:
                img_b64 = img_b64.split(",", 1)[1]
            img_data = base64.b64decode(img_b64)
            
            # Read image via PIL
            img = Image.open(io.BytesIO(img_data))
            img_reader = ImageReader(img)
            
            # Draw fitting the page layout
            c.drawImage(img_reader, 0, 0, width, height)
            c.showPage()
            
        c.save()

        # Save record to database
        doc = ScannedDocument(
            name=name,
            file_path=file_path,
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(doc)
        db.session.commit()

        # Return download URL
        download_url = f"/api/campus/documents/scan/{doc.id}"
        return jsonify({
            "message": "Scanned document created successfully. It will be deleted in 5 minutes.",
            "document": {
                "id": doc.id,
                "name": doc.name,
                "download_url": download_url,
                "created_at": doc.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        # Clean up partial file if exists
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        return jsonify({"error": f"Failed to generate PDF: {str(e)}"}), 500


@campus_bp.route("/documents/scan/<doc_id>", methods=["GET"])
def download_scanned_document(doc_id):
    """Download a scanned document as PDF (if not expired)."""
    import os
    from flask import send_from_directory
    from ..models.campus import ScannedDocument

    # Clean up expired documents
    cleanup_expired_documents()

    doc = db.session.get(ScannedDocument, doc_id)
    if not doc:
        return jsonify({"error": "Document not found or has expired after 5 minutes."}), 404

    directory = os.path.dirname(doc.file_path)
    filename = os.path.basename(doc.file_path)
    
    # Send PDF as an attachment download
    response = send_from_directory(directory, filename, as_attachment=True)
    # Set fallback filename
    response.headers["Content-Disposition"] = f"attachment; filename={doc.name}.pdf"
    return response


@campus_bp.route("/documents/scan/<doc_id>", methods=["DELETE"])
@jwt_required()
def delete_scanned_document(doc_id):
    """Manually delete a scanned document."""
    import os
    from ..models.campus import ScannedDocument
    from ..extensions import db

    doc = db.session.get(ScannedDocument, doc_id)
    if not doc:
        return jsonify({"error": "Document not found."}), 404

    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
        db.session.delete(doc)
        db.session.commit()
        return jsonify({"message": "Document deleted successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete: {str(e)}"}), 500


@campus_bp.route("/documents/scan", methods=["GET"])
@jwt_required()
def list_scanned_documents():
    """List non-expired scanned documents."""
    from ..models.campus import ScannedDocument
    cleanup_expired_documents()
    
    docs = ScannedDocument.query.order_by(ScannedDocument.created_at.desc()).all()
    res = []
    for d in docs:
        res.append({
            "id": d.id,
            "name": d.name,
            "download_url": f"/api/campus/documents/scan/{d.id}",
            "created_at": d.created_at.isoformat()
        })
    return jsonify({"documents": res}), 200


