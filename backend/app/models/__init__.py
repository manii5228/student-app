"""Models package — All SQLAlchemy ORM models for the Super-App."""

from .user import User, UserSession, CoordinatorAssignment, IDCardTemplate
from .attendance import Attendance, AttendanceRecord, AttendanceDiscrepancy
from .timetable import Timetable, TimetableSlot
from .academic import (
    Assignment, AssignmentSubmission, Result, Syllabus,
    ExamSchedule, CreditProgress, InternalMark,
)
from .campus import (
    CanteenItem, CanteenOrder, Bus, LibraryBook, LibraryIssue,
    Event, EventRegistration, Notice, Club, ClubMembership,
    Feedback, MarketListing, HealthAppointment, EmergencyAlert,
    ScannedDocument, IndoorPOI,
)
from .career import (
    JobPosting, JobApplication, InterviewSchedule, CompanyPrepQuestion,
    AlumniProfile, LeaveRequest, MeetingSlot, Resource,
    AuditLog, FeeRecord, Portfolio, Flashcard,
)


__all__ = [
    "User", "UserSession", "CoordinatorAssignment", "IDCardTemplate",
    "Attendance", "AttendanceRecord", "AttendanceDiscrepancy",
    "Timetable", "TimetableSlot",
    "Assignment", "AssignmentSubmission", "Result", "Syllabus",
    "ExamSchedule", "CreditProgress", "InternalMark",
    "CanteenItem", "CanteenOrder", "Bus", "LibraryBook", "LibraryIssue",
    "Event", "EventRegistration", "Notice", "Club", "ClubMembership",
    "Feedback", "MarketListing",
    "JobPosting", "JobApplication", "InterviewSchedule", "CompanyPrepQuestion",
    "AlumniProfile", "LeaveRequest", "MeetingSlot", "Resource",
    "HealthAppointment", "EmergencyAlert", "AuditLog", "FeeRecord",
    "Portfolio", "Flashcard", "ScannedDocument", "IndoorPOI",
]
