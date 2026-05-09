"""
Authentication routes: register, login, /me, forgot-password, reset-password.

Rate limiting
─────────────
Login and register are the two endpoints most targeted by credential-
stuffing and automated sign-up bots, so they carry stricter limits than
the global default (60/min defined in main.py):

    POST /auth/login           — 10 attempts / minute  (settings.RATE_LIMIT_AUTH)
    POST /auth/register        — 5  attempts / minute
    POST /auth/forgot-password — 5  attempts / minute

slowapi requires `request: Request` as an explicit parameter on every
decorated endpoint.  FastAPI injects it automatically; no client-facing
behaviour changes.
"""

import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import ExpiredSignatureError, JWTError, jwt

from app.config import settings
from app.database import allowed_emails_collection, users_collection
from app.models.user_model import user_helper
from app.schemas.user_schema import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.utils.rate_limit import limiter
from app.utils.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Register ──────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserRegister):
    """
    Create a new **user** account.

    - **username**: 3–50 characters; letters, digits, `_`, `-`, `.` only
    - **email**: must be unique; normalised to lowercase
    - **password**: minimum 6 characters

    All public registrations receive the **user** role.
    Admin role can only be granted via `POST /api/v1/admin/promote`.
    """
    # Gmail-only restriction
    if not user_data.email.lower().endswith("@gmail.com"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Gmail addresses (@gmail.com) are allowed to register.",
        )

    # Check allowlist — only pre-approved emails may register
    if not await allowed_emails_collection.find_one({"email": user_data.email}):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This email is not authorised to register. Please contact an administrator.",
        )

    if await users_collection.find_one({"email": user_data.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    doc = {
        "username":        user_data.username,
        "email":           user_data.email,
        "hashed_password": hash_password(user_data.password),
        "role":            "user",   # hard-coded — cannot be overridden via API
    }
    result   = await users_collection.insert_one(doc)
    new_user = await users_collection.find_one({"_id": result.inserted_id})
    logger.info("New user registered: %s", user_data.email)
    return user_helper(new_user)


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=Token,
    summary="Login and receive a JWT Bearer token",
)
@limiter.limit(settings.RATE_LIMIT_AUTH)   # 10/minute by default
async def login(request: Request, credentials: UserLogin):
    """
    Authenticate with email + password.

    Returns a **Bearer token** to be passed in the
    `Authorization: Bearer <token>` header for all protected endpoints.

    The token expires after `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60).
    """
    user = await users_collection.find_one({"email": credentials.email})

    # Deliberate: use the same error message whether the email exists or not
    # to prevent user-enumeration attacks.
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        logger.warning("Failed login attempt for email: %s", credentials.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(
        data={"sub": user["email"], "role": user.get("role", "user")}
    )
    logger.info("User logged in: %s", credentials.email)
    return {"access_token": token, "token_type": "bearer"}


# ── Current user ──────────────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the authenticated user's profile",
)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the profile of the user who owns the provided JWT token."""
    return user_helper(current_user)


# ── Forgot password ───────────────────────────────────────────────────────────

@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    summary="Request a password-reset token",
)
@limiter.limit("5/minute")
async def forgot_password(request: Request, body: ForgotPasswordRequest):
    """
    Generate a short-lived (15 min) password-reset token.

    **Production note**: this endpoint should send the token via email rather
    than returning it in the response body.  The `reset_token` field is
    populated only in non-production environments so the feature can be used
    without an SMTP server.

    The response always returns 200 regardless of whether the email exists
    to prevent user-enumeration.
    """
    user = await users_collection.find_one({"email": body.email})

    if user is None:
        # Return generic 200 — don't reveal whether the email is registered
        return ForgotPasswordResponse(
            message="If that email is registered, a reset link has been sent.",
        )

    reset_token = create_access_token(
        data={"sub": user["email"], "type": "password_reset"},
        expires_delta=timedelta(minutes=15),
    )
    logger.info("Password reset token issued for: %s", body.email)

    # In production, email the token instead of returning it
    if settings.is_production:
        return ForgotPasswordResponse(
            message="If that email is registered, a reset link has been sent.",
        )

    return ForgotPasswordResponse(
        message="Reset token generated. Use it at POST /auth/reset-password.",
        reset_token=reset_token,
    )


# ── Reset password ────────────────────────────────────────────────────────────

@router.post(
    "/reset-password",
    summary="Reset password using a valid reset token",
)
async def reset_password(body: ResetPasswordRequest):
    """
    Validate the reset token and update the user's password.

    The token must:
    - Be a valid JWT signed with the app secret
    - Not be expired (15-minute window)
    - Carry `"type": "password_reset"` in its payload
    """
    invalid_exc = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired reset token.",
    )

    try:
        payload = jwt.decode(
            body.token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except (ExpiredSignatureError, JWTError):
        raise invalid_exc

    if payload.get("type") != "password_reset":
        raise invalid_exc

    email: str | None = payload.get("sub")
    if not email:
        raise invalid_exc

    user = await users_collection.find_one({"email": email})
    if user is None:
        raise invalid_exc

    await users_collection.update_one(
        {"email": email},
        {"$set": {"hashed_password": hash_password(body.new_password)}},
    )
    logger.info("Password reset completed for: %s", email)
    return {"message": "Password updated successfully."}
