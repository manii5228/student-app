"""Models package — All SQLAlchemy ORM models for the Super-App."""

from .user import User, UserSession
from .attendance import Attendance, AttendanceRecord
from .timetable import Timetable, TimetableSlot
from .academic import (
    Assignment, AssignmentSubmission, Result, Syllabus,
    ExamSchedule, CreditProgress, InternalMark,
)
from .campus import (
    CanteenItem, CanteenOrder, Bus, LibraryBook, LibraryIssue,
    Event, EventRegistration, Notice, Club, ClubMembership,
    Feedback, MarketListing,
)
from .career import (
    JobPosting, JobApplication, InterviewSchedule, CompanyPrepQuestion,
    AlumniProfile, LeaveRequest, MeetingSlot, Resource,
    HealthAppointment, EmergencyAlert, AuditLog, FeeRecord,
)

__all__ = [
    "User", "UserSession",
    "Attendance", "AttendanceRecord",
    "Timetable", "TimetableSlot",
    "Assignment", "AssignmentSubmission", "Result", "Syllabus",
    "ExamSchedule", "CreditProgress", "InternalMark",
    "CanteenItem", "CanteenOrder", "Bus", "LibraryBook", "LibraryIssue",
    "Event", "EventRegistration", "Notice", "Club", "ClubMembership",
    "Feedback", "MarketListing",
    "JobPosting", "JobApplication", "InterviewSchedule", "CompanyPrepQuestion",
    "AlumniProfile", "LeaveRequest", "MeetingSlot", "Resource",
    "HealthAppointment", "EmergencyAlert", "AuditLog", "FeeRecord",
]
