"""
User-related Pydantic schemas.

Validation improvements over the original:
- username: strips whitespace, rejects characters that break URLs / display names
- email: normalised to lowercase by EmailStr automatically
- password: minimum length enforced; caller gets a clear field-level error
- All string inputs are stripped of surrounding whitespace before validation
  so "  john  " is treated the same as "john".
"""

import re
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRole(str, Enum):
    user  = "user"
    admin = "admin"


# ── Registration / Login ──────────────────────────────────────────────────────

class UserRegister(BaseModel):
    """
    Request body for POST /auth/register.

    Role is intentionally absent — public registration always creates a
    'user' account.  Admin role is granted via POST /admin/promote (admin-only).
    """
    username: str    = Field(..., min_length=3, max_length=50, examples=["john_doe"])
    email:    EmailStr = Field(..., examples=["john@example.com"])
    password: str    = Field(..., min_length=6,  examples=["secret123"])

    @field_validator("username", mode="before")
    @classmethod
    def _clean_username(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(r"[A-Za-z0-9_.\-]{3,50}", v):
            raise ValueError(
                "Username may only contain letters, digits, underscores, "
                "hyphens, and periods (3–50 characters)."
            )
        return v

    @field_validator("email", mode="before")
    @classmethod
    def _normalise_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v

    @field_validator("password", mode="before")
    @classmethod
    def _check_password(cls, v: str) -> str:
        v = v.strip() if isinstance(v, str) else v
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return v


class UserLogin(BaseModel):
    """Request body for POST /auth/login."""
    email:    EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def _normalise_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v


# ── Responses ─────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """Returned by register / login / /auth/me and admin endpoints."""
    id:            str
    username:      str
    email:         str
    role:          str
    picture:       Optional[str] = None   # Google profile photo URL (OAuth users only)
    auth_provider: Optional[str] = None   # "local" | "google"


class Token(BaseModel):
    """JWT response from POST /auth/login."""
    access_token: str
    token_type:   str = "bearer"


class TokenData(BaseModel):
    """Decoded JWT payload — used internally by the auth dependency."""
    email: Optional[str] = None
    role:  Optional[str] = None


# ── Admin ─────────────────────────────────────────────────────────────────────

class AdminStats(BaseModel):
    """Response for GET /admin/stats."""
    total_users:    int
    admin_users:    int
    regular_users:  int
    total_tasks:    int
    completed_tasks: int
    active_tasks:   int
    todo_tasks:     int


# ── Password reset ────────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    """Request body for POST /auth/forgot-password."""
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def _normalise_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v


class ForgotPasswordResponse(BaseModel):
    """
    Response for POST /auth/forgot-password.

    In production this endpoint would send an email instead of returning
    the token.  For development the token is returned directly so the
    feature can be exercised without an SMTP server.
    """
    message:     str
    reset_token: Optional[str] = None   # None in production mode


class ResetPasswordRequest(BaseModel):
    """Request body for POST /auth/reset-password."""
    token:        str
    new_password: str = Field(..., min_length=6, examples=["newSecret123"])

    @field_validator("new_password", mode="before")
    @classmethod
    def _check_password(cls, v: str) -> str:
        v = v.strip() if isinstance(v, str) else v
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return v


# ── Google OAuth ──────────────────────────────────────────────────────────────

class GoogleAuthRequest(BaseModel):
    """Request body for POST /auth/google."""
    access_token: str = Field(..., description="Google OAuth2 access token from the frontend")
