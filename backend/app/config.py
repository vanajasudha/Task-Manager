"""
Centralised, type-safe application configuration.

All settings are read from environment variables (or a .env file).
Required fields (MONGO_URI, JWT_SECRET_KEY) have no default — the
server refuses to start if they are missing, giving an immediate,
clear error instead of a silent misconfiguration.

Usage anywhere in the app:
    from app.config import settings
    print(settings.APP_ENV)
"""

from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Application ──────────────────────────────────────────────────────────
    APP_ENV: str = "development"          # development | staging | production
    APP_NAME: str = "Task Management API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── MongoDB ──────────────────────────────────────────────────────────────
    MONGO_URI: str                        # required — no default
    MONGO_DB_NAME: str = "task_management_db"

    # ── JWT ──────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str                   # required — no default
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Comma-separated string in .env: "http://localhost:5173,https://app.example.com"
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # ── Google OAuth ─────────────────────────────────────────────────────────
    # From Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs
    GOOGLE_CLIENT_ID: str = ""

    # ── Rate limiting (slowapi / limits notation) ─────────────────────────────
    RATE_LIMIT_DEFAULT: str = "60/minute"   # applied to all routes
    RATE_LIMIT_AUTH: str = "10/minute"      # stricter limit on login / register

    # ── pydantic-settings config ──────────────────────────────────────────────
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,   # MONGO_URI ≠ mongo_uri
        extra="ignore",        # unknown .env vars are silently ignored
    )

    # ── Validators ────────────────────────────────────────────────────────────

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v: str | list) -> list[str]:
        """Accept either a Python list or a comma-separated env string."""
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @field_validator("APP_ENV")
    @classmethod
    def _validate_app_env(cls, v: str) -> str:
        allowed = {"development", "staging", "production"}
        if v not in allowed:
            raise ValueError(f"APP_ENV must be one of {allowed}, got '{v}'")
        return v

    # ── Derived helpers ───────────────────────────────────────────────────────

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"


@lru_cache
def get_settings() -> Settings:
    """
    Return a cached Settings instance.
    lru_cache ensures .env is only parsed once per process.
    Call get_settings() instead of importing `settings` in tests
    so you can easily override with a mock.
    """
    return Settings()


# Module-level singleton — imported throughout the app
settings: Settings = get_settings()
