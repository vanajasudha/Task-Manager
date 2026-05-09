"""
Authentication utilities: password hashing, JWT creation/validation,
and FastAPI dependency functions for protected routes.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import ExpiredSignatureError, JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import users_collection
from app.schemas.user_schema import TokenData

logger = logging.getLogger(__name__)

# ── Password hashing ──────────────────────────────────────────────────────────

# bcrypt context with automatic re-hashing of outdated rounds
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Return a bcrypt hash of *password*."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches *hashed*."""
    return pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────

# Tells FastAPI's Swagger UI where to send the login form
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Sign and return a JWT.

    The `sub` claim should be the user's email (stable, unique identifier).
    The `role` claim is embedded so the admin check doesn't need an extra
    DB round-trip.

    Token lifetime defaults to settings.ACCESS_TOKEN_EXPIRE_MINUTES but
    callers can pass an explicit `expires_delta` for special flows (e.g.
    short-lived password-reset tokens).
    """
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# ── FastAPI dependencies ──────────────────────────────────────────────────────

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency: decode the Bearer token and return the user document.

    Raises:
        401 — token missing, malformed, or signature invalid
        401 — token is expired
        401 — user no longer exists in the database
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    expired_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token has expired. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exc
        token_data = TokenData(email=email)
    except ExpiredSignatureError:
        # Provide a clear message for expired tokens instead of the generic 401
        raise expired_exc
    except JWTError:
        raise credentials_exc

    user = await users_collection.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exc
    return user


async def get_current_admin_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency: like get_current_user but also enforces the 'admin' role.

    Raises:
        403 — authenticated user does not have the admin role
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
