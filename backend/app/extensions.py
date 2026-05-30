"""
Flask Extensions
=================
Initialized here, bound to the app in the factory.
"""

import os
import logging
# pyrefly: ignore [missing-import]
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
# pyrefly: ignore [missing-import]
from flask_jwt_extended import JWTManager
# pyrefly: ignore [missing-import]
from flask_limiter import Limiter
# pyrefly: ignore [missing-import]
from flask_limiter.util import get_remote_address


# ── Database ───────────────────────────────────────────────────────
db = SQLAlchemy()

# Enable WAL mode for SQLite to prevent concurrency locking issues
from sqlalchemy import event
from sqlalchemy.engine import Engine
import sqlite3

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# ── Migrations ─────────────────────────────────────────────────────
migrate = Migrate()

# ── JWT Authentication ─────────────────────────────────────────────
jwt = JWTManager()

# ── Rate Limiter ───────────────────────────────────────────────────
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per minute"],
    storage_uri="memory://",
)

# ── Dummy Redis Client for Local Dev without Docker ────────────────
class DummyRedis:
    def __init__(self):
        self.store = {}
        logging.warning("Using DummyRedis (In-Memory). For production, use real Redis.")
    def init_app(self, app): pass
    def get(self, key): return self.store.get(key)
    def setex(self, key, time, value): self.store[key] = value
    def delete(self, key): self.store.pop(key, None)
    def ping(self): return True

redis_client = DummyRedis()
