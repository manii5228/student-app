"""
Configuration Module
=====================
Supports Development, Testing, and Production environments.
Database is fully swappable via SQLALCHEMY_DATABASE_URI.
"""

import os
from datetime import timedelta


class BaseConfig:
    """Base configuration shared across all environments."""
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-dev-key-change-in-prod")

    # ── SQLAlchemy (Database-Swappable) ────────────────────────────
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 20,
        "max_overflow": 30,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
    }

    # ── JWT ────────────────────────────────────────────────────────
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-in-prod")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # ── Redis ──────────────────────────────────────────────────────
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # ── Rate Limiting ──────────────────────────────────────────────
    RATELIMIT_STORAGE_URI = os.getenv("REDIS_URL", "redis://localhost:6379/1")
    RATELIMIT_DEFAULT = "200 per minute"

    # ── App Settings ───────────────────────────────────────────────
    COLLEGE_NAME = os.getenv("COLLEGE_NAME", "VelTech University")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB upload limit
    QR_CODE_VALIDITY_SECONDS = 120  # 2-minute QR expiry


class DevelopmentConfig(BaseConfig):
    """Development environment config."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://superapp:superapp_pass@localhost:5432/superapp_dev"
    )


class TestingConfig(BaseConfig):
    """Testing environment config — uses SQLite for speed."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_DATABASE_URL",
        "sqlite:///test_superapp.db"
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)


class ProductionConfig(BaseConfig):
    """Production environment config."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    SECRET_KEY = os.getenv("SECRET_KEY")

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 50,
        "max_overflow": 60,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
    }


config_map = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
