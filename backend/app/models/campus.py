"""
Campus Models — Canteen, Bus, Library, Events, Notices, Clubs, Feedback, Marketplace
"""

import uuid
from datetime import datetime, timezone
from ..extensions import db


class CanteenItem(db.Model):
    __tablename__ = "canteen_items"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    is_available = db.Column(db.Boolean, default=True)
    prep_time_minutes = db.Column(db.Integer, default=10)
    canteen_name = db.Column(db.String(100), default="Main Canteen")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "name": self.name, "description": self.description,
                "price": self.price, "category": self.category, "is_available": self.is_available,
                "prep_time_minutes": self.prep_time_minutes}


class CanteenOrder(db.Model):
    __tablename__ = "canteen_orders"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    items_json = db.Column(db.Text, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="placed")
    order_number = db.Column(db.String(10), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "student_id": self.student_id, "items_json": self.items_json,
                "total_amount": self.total_amount, "status": self.status, "order_number": self.order_number,
                "created_at": self.created_at.isoformat() if self.created_at else None}


class Bus(db.Model):
    __tablename__ = "buses"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bus_number = db.Column(db.String(20), unique=True, nullable=False)
    route_name = db.Column(db.String(200), nullable=False)
    route_stops = db.Column(db.Text, nullable=True)
    driver_name = db.Column(db.String(100), nullable=True)
    driver_phone = db.Column(db.String(20), nullable=True)
    capacity = db.Column(db.Integer, default=50)
    current_lat = db.Column(db.Float, nullable=True)
    current_lng = db.Column(db.Float, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    last_updated = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "bus_number": self.bus_number, "route_name": self.route_name,
                "route_stops": self.route_stops, "driver_name": self.driver_name,
                "current_lat": self.current_lat, "current_lng": self.current_lng, "is_active": self.is_active}


class LibraryBook(db.Model):
    __tablename__ = "library_books"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(300), nullable=False)
    author = db.Column(db.String(200), nullable=False)
    isbn = db.Column(db.String(20), unique=True, nullable=True)
    category = db.Column(db.String(100), nullable=True)
    total_copies = db.Column(db.Integer, default=1)
    available_copies = db.Column(db.Integer, default=1)
    shelf_location = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {"id": self.id, "title": self.title, "author": self.author, "isbn": self.isbn,
                "category": self.category, "total_copies": self.total_copies,
                "available_copies": self.available_copies, "shelf_location": self.shelf_location}


class LibraryIssue(db.Model):
    __tablename__ = "library_issues"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    book_id = db.Column(db.String(36), db.ForeignKey("library_books.id"), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    issued_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    returned_date = db.Column(db.Date, nullable=True)
    fine_amount = db.Column(db.Float, default=0.0)
    renewed_count = db.Column(db.Integer, default=0)
    book = db.relationship("LibraryBook", backref="issues")

    def to_dict(self):
        return {"id": self.id, "book_id": self.book_id, "student_id": self.student_id,
                "issued_date": str(self.issued_date), "due_date": str(self.due_date),
                "returned_date": str(self.returned_date) if self.returned_date else None,
                "fine_amount": self.fine_amount, "renewed_count": self.renewed_count}


class Event(db.Model):
    __tablename__ = "events"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    event_type = db.Column(db.String(50), default="fest")
    organizer_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    venue = db.Column(db.String(200), nullable=True)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=True)
    max_participants = db.Column(db.Integer, nullable=True)
    registration_count = db.Column(db.Integer, default=0)
    is_approved = db.Column(db.Boolean, default=False)
    image_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    registrations = db.relationship("EventRegistration", backref="event", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "title": self.title, "description": self.description,
                "event_type": self.event_type, "venue": self.venue,
                "start_date": self.start_date.isoformat() if self.start_date else None,
                "end_date": self.end_date.isoformat() if self.end_date else None,
                "max_participants": self.max_participants, "registration_count": self.registration_count,
                "is_approved": self.is_approved}


class EventRegistration(db.Model):
    __tablename__ = "event_registrations"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = db.Column(db.String(36), db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(30), default="participant")
    registered_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "event_id": self.event_id, "student_id": self.student_id, "role": self.role}


class Notice(db.Model):
    __tablename__ = "notices"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(300), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    priority = db.Column(db.String(20), default="normal")
    target_audience = db.Column(db.String(50), default="all")
    is_pinned = db.Column(db.Boolean, default=False)
    attachment_url = db.Column(db.String(500), nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    reads = db.relationship("NoticeRead", backref="notice", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "title": self.title, "content": self.content,
                "priority": self.priority, "target_audience": self.target_audience,
                "is_pinned": self.is_pinned, "created_at": self.created_at.isoformat() if self.created_at else None}


class NoticeRead(db.Model):
    __tablename__ = "notice_reads"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    notice_id = db.Column(db.String(36), db.ForeignKey("notices.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    read_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "notice_id": self.notice_id, "user_id": self.user_id, "read_at": self.read_at.isoformat()}


class Club(db.Model):
    __tablename__ = "clubs"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    club_type = db.Column(db.String(50), default="technical")
    faculty_advisor_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    president_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    member_count = db.Column(db.Integer, default=0)
    logo_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    memberships = db.relationship("ClubMembership", backref="club", lazy="dynamic", cascade="all, delete-orphan")
    posts = db.relationship("ClubPost", backref="club", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "name": self.name, "description": self.description,
                "club_type": self.club_type, "member_count": self.member_count, 
                "is_active": self.is_active, "president_id": self.president_id}


class ClubMembership(db.Model):
    __tablename__ = "club_memberships"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(db.String(36), db.ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(30), default="member")
    joined_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "club_id": self.club_id, "student_id": self.student_id, "role": self.role}


class ClubPost(db.Model):
    __tablename__ = "club_posts"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(db.String(36), db.ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    author_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "club_id": self.club_id, "author_id": self.author_id,
                "content": self.content, "image_url": self.image_url,
                "created_at": self.created_at.isoformat()}


class ClubAttendance(db.Model):
    __tablename__ = "club_attendance"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(db.String(36), db.ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    event_title = db.Column(db.String(200), nullable=False)
    hours = db.Column(db.Float, default=1.0)
    scanned_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "club_id": self.club_id, "student_id": self.student_id,
                "event_title": self.event_title, "hours": self.hours, "scanned_at": self.scanned_at.isoformat()}


class Feedback(db.Model):
    __tablename__ = "feedbacks"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default="general")
    is_anonymous = db.Column(db.Boolean, default=True)
    author_id = db.Column(db.String(36), nullable=True)
    status = db.Column(db.String(20), default="open")
    admin_response = db.Column(db.Text, nullable=True)
    upvotes = db.Column(db.Integer, default=0)
    sentiment = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "content": self.content, "category": self.category,
                "is_anonymous": self.is_anonymous, "status": self.status,
                "admin_response": self.admin_response, "upvotes": self.upvotes,
                "sentiment": self.sentiment}


class MarketListing(db.Model):
    __tablename__ = "market_listings"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), default="books")
    condition = db.Column(db.String(20), default="good")
    image_url = db.Column(db.String(500), nullable=True)
    is_sold = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "seller_id": self.seller_id, "title": self.title,
                "price": self.price, "category": self.category, "condition": self.condition, "is_sold": self.is_sold}

class HostelPass(db.Model):
    __tablename__ = "hostel_passes"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    reason = db.Column(db.String(500), nullable=False)
    from_date = db.Column(db.DateTime, nullable=False)
    to_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default="pending") # pending, approved, rejected
    qr_code_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id, 
            "student_id": self.student_id, 
            "reason": self.reason,
            "from_date": self.from_date.isoformat(), 
            "to_date": self.to_date.isoformat(), 
            "status": self.status, 
            "qr_code_url": self.qr_code_url,
            "created_at": self.created_at.isoformat()
        }


# ── Health Center ──────────────────────────────────────────────────

class HealthAppointment(db.Model):
    __tablename__ = "health_appointments"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    doctor_name = db.Column(db.String(200), default="Campus Doctor")
    appointment_type = db.Column(db.String(50), default="general")  # general, dental, eye, mental_health
    description = db.Column(db.Text, nullable=True)
    preferred_date = db.Column(db.Date, nullable=False)
    preferred_time = db.Column(db.String(20), nullable=True)  # morning, afternoon, evening
    status = db.Column(db.String(20), default="pending")  # pending, confirmed, completed, cancelled
    notes = db.Column(db.Text, nullable=True)  # doctor notes
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id, "student_id": self.student_id,
            "doctor_name": self.doctor_name, "appointment_type": self.appointment_type,
            "description": self.description,
            "preferred_date": str(self.preferred_date) if self.preferred_date else None,
            "preferred_time": self.preferred_time, "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ── Emergency Alert ────────────────────────────────────────────────

class EmergencyAlert(db.Model):
    __tablename__ = "emergency_alerts"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    alert_type = db.Column(db.String(30), nullable=False)  # medical, security, fire, other
    message = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(200), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), default="active")  # active, acknowledged, resolved
    acknowledged_by = db.Column(db.String(36), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "student_id": self.student_id,
            "alert_type": self.alert_type, "message": self.message,
            "location": self.location, "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ── Polls & Surveys ───────────────────────────────────────────────

class Poll(db.Model):
    __tablename__ = "polls"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    options_json = db.Column(db.Text, nullable=False)  # JSON: ["Option A", "Option B", ...]
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    total_votes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    votes = db.relationship("PollVote", backref="poll", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        import json
        return {
            "id": self.id, "title": self.title, "description": self.description,
            "options": json.loads(self.options_json) if self.options_json else [],
            "is_active": self.is_active, "total_votes": self.total_votes,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PollVote(db.Model):
    __tablename__ = "poll_votes"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    poll_id = db.Column(db.String(36), db.ForeignKey("polls.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    option_index = db.Column(db.Integer, nullable=False)
    voted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "poll_id": self.poll_id, "option_index": self.option_index}
