"""
Timetable Service
==================
Business logic for timetable operations.
Implements Redis caching for 15k+ requests/hour throughput.
"""

import json
from datetime import datetime, timezone, date, time
from typing import Optional, Dict, List, Tuple

from ..models.timetable import DayOfWeek, SlotType
from ..repositories.timetable_repo import TimetableRepository
from ..extensions import redis_client


# Cache TTL: 30 minutes (timetable doesn't change frequently)
TIMETABLE_CACHE_TTL = 1800


class TimetableService:
    """Service for timetable business logic with Redis caching."""

    def __init__(self):
        self.timetable_repo = TimetableRepository()

    # ── Create Timetable ───────────────────────────────────────────

    def create_timetable(self, admin_id: str, data: dict) -> Tuple[Optional[Dict], Optional[str]]:
        """Create a new master timetable."""
        try:
            timetable = self.timetable_repo.create(
                name=data["name"],
                department=data["department"],
                semester=data["semester"],
                section=data["section"],
                academic_year=data["academic_year"],
                created_by=admin_id,
                effective_from=data.get("effective_from"),
                effective_until=data.get("effective_until"),
            )
            self.timetable_repo.commit()
            return timetable.to_dict(), None

        except Exception as e:
            self.timetable_repo.rollback()
            return None, f"Failed to create timetable: {str(e)}"

    # ── Add Slot ───────────────────────────────────────────────────

    def add_slot(self, timetable_id: str, data: dict) -> Tuple[Optional[Dict], Optional[str]]:
        """Add a slot to a timetable with conflict detection."""
        day = DayOfWeek(data["day"])
        period_number = data["period_number"]

        # Check for conflicts
        conflicts = self.timetable_repo.check_conflicts(
            timetable_id=timetable_id,
            day=day,
            period_number=period_number,
            faculty_id=data.get("faculty_id"),
            room_number=data.get("room_number"),
        )

        if conflicts:
            return None, f"Scheduling conflicts detected: {json.dumps(conflicts)}"

        try:
            slot = self.timetable_repo.create_slot(
                timetable_id=timetable_id,
                day=day,
                period_number=period_number,
                start_time=time.fromisoformat(data["start_time"]),
                end_time=time.fromisoformat(data["end_time"]),
                slot_type=SlotType(data.get("slot_type", "lecture")),
                subject_code=data.get("subject_code"),
                subject_name=data.get("subject_name"),
                faculty_id=data.get("faculty_id"),
                faculty_name=data.get("faculty_name"),
                room_number=data.get("room_number"),
                building=data.get("building"),
            )
            self.timetable_repo.commit()

            # Invalidate cache
            timetable = self.timetable_repo.get_by_id(timetable_id)
            if timetable:
                self._invalidate_cache(timetable)

            return slot.to_dict(), None

        except Exception as e:
            self.timetable_repo.rollback()
            return None, f"Failed to add slot: {str(e)}"

    # ── Get Timetable (Redis-Cached) ───────────────────────────────

    def get_student_timetable(self, department: str, semester: int,
                                section: str,
                                day: Optional[str] = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Fetch timetable for a student's class.
        Uses Redis cache — handles 15k requests/hour without hitting DB.
        
        Cache strategy:
        - Key: timetable:{dept}:{sem}:{section}
        - TTL: 30 minutes
        - Invalidated on timetable update
        """
        cache_key = f"timetable:{department}:{semester}:{section}"

        # ── Try Redis Cache First (<2ms) ───────────────────────────
        try:
            cached = redis_client.get(cache_key)
            if cached:
                grid = json.loads(cached)
                if day:
                    return {"day": day, "slots": grid.get(day, [])}, None
                return {"grid": grid, "cached": True}, None
        except Exception:
            pass  # Redis down — fall through to DB

        # ── Cache Miss → Query PostgreSQL (>100ms) ─────────────────
        timetable = self.timetable_repo.get_active_timetable(
            department, semester, section,
        )

        if not timetable:
            return None, "No active timetable found for this class"

        grid = self.timetable_repo.get_full_timetable_grid(timetable.id)

        # ── Store in Redis for subsequent requests ─────────────────
        try:
            redis_client.setex(cache_key, TIMETABLE_CACHE_TTL, json.dumps(grid))
        except Exception:
            pass

        result = {
            "timetable_id": timetable.id,
            "name": timetable.name,
            "department": department,
            "semester": semester,
            "section": section,
            "grid": grid,
            "cached": False,
        }

        if day:
            result = {"day": day, "slots": grid.get(day, [])}

        return result, None

    # ── Get Faculty Timetable ──────────────────────────────────────

    def get_faculty_timetable(self, faculty_id: str) -> Dict:
        """Get all classes assigned to a faculty member."""
        cache_key = f"faculty_timetable:{faculty_id}"

        # Try cache
        try:
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

        slots = self.timetable_repo.get_faculty_timetable(faculty_id)
        grid = {}
        for slot in slots:
            day = slot.day.value
            if day not in grid:
                grid[day] = []
            grid[day].append(slot.to_dict())

        result = {"faculty_id": faculty_id, "grid": grid}

        # Cache for 30 min
        try:
            redis_client.setex(cache_key, TIMETABLE_CACHE_TTL, json.dumps(result))
        except Exception:
            pass

        return result

    # ── Get Current / Next Class ───────────────────────────────────

    def get_current_class(self, department: str, semester: int,
                           section: str) -> Optional[Dict]:
        """Determine the current or next class based on system time."""
        now = datetime.now()
        current_time = now.time()
        day_name = now.strftime("%A").lower()

        try:
            day = DayOfWeek(day_name)
        except ValueError:
            return {"message": "No classes today (Sunday)"}

        timetable, error = self.get_student_timetable(department, semester, section, day_name)
        if error or not timetable:
            return None

        slots = timetable.get("slots", [])
        current = None
        next_class = None

        for slot in slots:
            start = datetime.strptime(slot["start_time"], "%H:%M").time()
            end = datetime.strptime(slot["end_time"], "%H:%M").time()

            if start <= current_time <= end:
                current = slot
                current["status"] = "live"
            elif current_time < start and next_class is None:
                next_class = slot
                next_class["status"] = "upcoming"

        return {
            "current_class": current,
            "next_class": next_class,
            "day": day_name,
            "time": current_time.strftime("%H:%M"),
        }

    # ── Publish Timetable ──────────────────────────────────────────

    def publish_timetable(self, timetable_id: str) -> Tuple[bool, Optional[str]]:
        """Publish a timetable (make it visible to students)."""
        timetable = self.timetable_repo.get_by_id(timetable_id)
        if not timetable:
            return False, "Timetable not found"

        timetable.is_published = True
        self.timetable_repo.commit()

        # Invalidate old cache so fresh data is served
        self._invalidate_cache(timetable)

        return True, None

    # ── Cache Management ───────────────────────────────────────────

    def _invalidate_cache(self, timetable):
        """Invalidate all related caches when timetable changes."""
        try:
            key = f"timetable:{timetable.department}:{timetable.semester}:{timetable.section}"
            redis_client.delete(key)
        except Exception:
            pass
