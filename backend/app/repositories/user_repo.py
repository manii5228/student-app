"""
User Repository
================
Domain-specific queries for User and UserSession models.
"""

from typing import Optional, List

from .base import BaseRepository
from ..models.user import User, UserSession, UserRole


class UserRepository(BaseRepository):
    """Repository for User CRUD and lookup operations."""

    def __init__(self):
        super().__init__(User)

    def get_by_email(self, email: str) -> Optional[User]:
        """Find a user by email address."""
        return self.find_one_by(email=email)

    def get_by_roll_number(self, roll_number: str) -> Optional[User]:
        """Find a student by roll number."""
        return self.find_one_by(roll_number=roll_number)

    def get_by_employee_id(self, employee_id: str) -> Optional[User]:
        """Find a faculty member by employee ID."""
        return self.find_one_by(employee_id=employee_id)

    def get_by_role(self, role: UserRole, page: int = 1, per_page: int = 20) -> dict:
        """Get paginated users by role."""
        query = User.query.filter_by(role=role, is_active=True)\
            .order_by(User.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
        }

    def get_students_by_class(self, department: str, semester: int,
                               section: str) -> List[User]:
        """Get all students in a specific class (for attendance)."""
        return User.query.filter_by(
            role=UserRole.STUDENT,
            department=department,
            semester=semester,
            section=section,
            is_active=True,
        ).order_by(User.roll_number).all()

    def search_users(self, query: str, role: Optional[UserRole] = None) -> List[User]:
        """Search users by name, email, or roll number."""
        search = f"%{query}%"
        filters = [
            User.is_active == True,
            (User.first_name.ilike(search) |
             User.last_name.ilike(search) |
             User.email.ilike(search) |
             User.roll_number.ilike(search))
        ]
        if role:
            filters.append(User.role == role)
        return User.query.filter(*filters).limit(50).all()


class SessionRepository(BaseRepository):
    """Repository for user session management."""

    def __init__(self):
        super().__init__(UserSession)

    def get_active_sessions(self, user_id: str) -> List[UserSession]:
        """Get all active sessions for a user."""
        return self.find_by(user_id=user_id, is_active=True)

    def get_by_jti(self, jti: str) -> Optional[UserSession]:
        """Find a session by JWT Token ID."""
        return self.find_one_by(jti=jti)

    def revoke_session(self, session_id: str) -> bool:
        """Deactivate a specific session."""
        session = self.get_by_id(session_id)
        if session:
            session.is_active = False
            return True
        return False

    def revoke_all_sessions(self, user_id: str) -> int:
        """Deactivate all sessions for a user (logout everywhere)."""
        sessions = self.get_active_sessions(user_id)
        count = 0
        for s in sessions:
            s.is_active = False
            count += 1
        return count
