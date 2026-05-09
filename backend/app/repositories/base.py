"""
Base Repository
================
Generic CRUD operations abstracted from any specific database.
All concrete repositories inherit from this.

This is the core of the "Swap-Ready" architecture — the Flask app
never talks to the DB directly, only through this layer.
"""

from typing import Optional, List, Type, TypeVar, Dict, Any

from ..extensions import db

T = TypeVar("T", bound=db.Model)


class BaseRepository:
    """
    Generic repository providing standard CRUD operations.
    Subclass this for each model to add domain-specific queries.
    """

    def __init__(self, model: Type[T]):
        self.model = model

    # ── CREATE ─────────────────────────────────────────────────────
    def create(self, **kwargs) -> T:
        """Create a new entity and flush to get the ID."""
        instance = self.model(**kwargs)
        db.session.add(instance)
        db.session.flush()
        return instance

    def bulk_create(self, items: List[Dict[str, Any]]) -> List[T]:
        """Create multiple entities in a single transaction."""
        instances = [self.model(**item) for item in items]
        db.session.add_all(instances)
        db.session.flush()
        return instances

    # ── READ ───────────────────────────────────────────────────────
    def get_by_id(self, entity_id: str) -> Optional[T]:
        """Fetch a single entity by primary key."""
        return db.session.get(self.model, entity_id)

    def get_all(self, page: int = 1, per_page: int = 20) -> dict:
        """Paginated fetch of all entities."""
        query = self.model.query.order_by(self.model.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
            "per_page": pagination.per_page,
        }

    def find_by(self, **kwargs) -> List[T]:
        """Find entities matching the given criteria."""
        return self.model.query.filter_by(**kwargs).all()

    def find_one_by(self, **kwargs) -> Optional[T]:
        """Find a single entity matching the criteria."""
        return self.model.query.filter_by(**kwargs).first()

    def count(self, **kwargs) -> int:
        """Count entities matching the criteria."""
        if kwargs:
            return self.model.query.filter_by(**kwargs).count()
        return self.model.query.count()

    def exists(self, **kwargs) -> bool:
        """Check if an entity matching the criteria exists."""
        return self.model.query.filter_by(**kwargs).first() is not None

    # ── UPDATE ─────────────────────────────────────────────────────
    def update(self, entity_id: str, **kwargs) -> Optional[T]:
        """Update an entity by ID."""
        instance = self.get_by_id(entity_id)
        if instance is None:
            return None
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        db.session.flush()
        return instance

    # ── DELETE ─────────────────────────────────────────────────────
    def delete(self, entity_id: str) -> bool:
        """Delete an entity by ID."""
        instance = self.get_by_id(entity_id)
        if instance is None:
            return False
        db.session.delete(instance)
        db.session.flush()
        return True

    # ── TRANSACTION CONTROL ────────────────────────────────────────
    @staticmethod
    def commit():
        """Commit the current transaction."""
        db.session.commit()

    @staticmethod
    def rollback():
        """Rollback the current transaction."""
        db.session.rollback()
