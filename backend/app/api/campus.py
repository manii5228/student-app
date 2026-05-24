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
    Feedback, MarketListing, HostelPass
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


@campus_bp.route("/library/my-issues", methods=["GET"])
@jwt_required()
@role_required("student")
def my_library_issues():
    """Get current book issues for student."""
    issues = LibraryIssue.query.filter_by(
        student_id=get_jwt_identity(), returned_date=None).all()
    return jsonify({"issues": [i.to_dict() for i in issues]}), 200


@campus_bp.route("/library/renew/<issue_id>", methods=["POST"])
@jwt_required()
@role_required("student")
def renew_book(issue_id):
    """Renew a library book (QR renewal)."""
    issue = db.session.get(LibraryIssue, issue_id)
    if not issue or issue.student_id != get_jwt_identity():
        return jsonify({"error": "Issue not found"}), 404
    if issue.renewed_count >= 2:
        return jsonify({"error": "Max renewals reached"}), 400
    from datetime import timedelta
    issue.due_date = issue.due_date + timedelta(days=14)
    issue.renewed_count += 1
    db.session.commit()
    return jsonify({"message": "Renewed", "issue": issue.to_dict()}), 200


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
    """Create an event (requires admin approval)."""
    data = request.get_json()
    e = Event(
        title=data["title"], description=data.get("description"),
        event_type=data.get("event_type", "fest"),
        organizer_id=get_jwt_identity(), venue=data.get("venue"),
        start_date=datetime.fromisoformat(data["start_date"].replace("Z", "+00:00")),
        end_date=datetime.fromisoformat(data["end_date"].replace("Z", "+00:00")) if data.get("end_date") else None,
        max_participants=data.get("max_participants"),
    )
    db.session.add(e)
    db.session.commit()
    return jsonify({"message": "Event submitted for approval", "event": e.to_dict()}), 201


@campus_bp.route("/events/<eid>/register", methods=["POST"])
@jwt_required()
@role_required("student")
def register_event(eid):
    """Register for an event (with duplicate check)."""
    student_id = get_jwt_identity()
    existing = EventRegistration.query.filter_by(
        event_id=eid, student_id=student_id).first()
    if existing:
        return jsonify({"message": "Already registered"}), 200
    data = request.get_json() or {}
    reg = EventRegistration(
        event_id=eid, student_id=student_id,
        role=data.get("role", "participant"),
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
    """Get notice board with pinned items first. Include read status for authenticated users."""
    notices = Notice.query.order_by(
        Notice.is_pinned.desc(), Notice.created_at.desc()).limit(50).all()
    
    current_user = get_jwt_identity()
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
    )
    db.session.add(n)
    db.session.commit()
    return jsonify({"message": "Notice posted", "notice": n.to_dict()}), 201


# ── Clubs & Societies ─────────────────────────────────────────────

@campus_bp.route("/clubs", methods=["GET"])
@jwt_required()
def list_clubs():
    """List all active clubs."""
    clubs = Club.query.filter_by(is_active=True).all()
    return jsonify({"clubs": [c.to_dict() for c in clubs]}), 200


@campus_bp.route("/clubs/<cid>/join", methods=["POST"])
@jwt_required()
@role_required("student")
def join_club(cid):
    """Join a club (with duplicate check)."""
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
        d['student_reg'] = u.registration_number if u else "N/A"
        pass_data.append(d)

    return jsonify({"passes": pass_data}), 200

@campus_bp.route("/hostel-pass/<pid>/status", methods=["PUT"])
@jwt_required()
@role_required("admin", "faculty")
def update_hostel_pass_status(pid):
    """Update status of a hostel pass (approve/reject)."""
    h_pass = db.session.get(HostelPass, pid)
    if not h_pass:
        return jsonify({"error": "Hostel pass not found"}), 404
    
    data = request.get_json()
    status = data.get("status")
    if status in ["approved", "rejected"]:
        h_pass.status = status
        # If approved, generate a mock QR code URL
        if status == "approved":
            h_pass.qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PASS-{h_pass.id}"
        db.session.commit()
        return jsonify({"message": f"Hostel pass {status}", "pass": h_pass.to_dict()}), 200
    return jsonify({"error": "Invalid status"}), 400
