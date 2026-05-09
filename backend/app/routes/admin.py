import logging
from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.database import allowed_emails_collection, tasks_collection, users_collection
from app.models.user_model import user_helper
from app.schemas.user_schema import AdminStats, UserResponse
from app.utils.security import get_current_admin_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])

# Readable alias — imported by other modules that need the admin dependency
require_admin = get_current_admin_user


# ── Allowlist schemas ─────────────────────────────────────────────────────────

class AllowedEmailIn(BaseModel):
    email: EmailStr

class AllowedEmailOut(BaseModel):
    email: str
    added_by: str
    added_at: datetime


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_object_id(user_id: str) -> ObjectId:
    """Validate path param and return ObjectId, or raise 400."""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )
    return ObjectId(user_id)


async def _get_user_or_404(oid: ObjectId) -> dict:
    """Fetch user by ObjectId, or raise 404."""
    user = await users_collection.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# ── List users ────────────────────────────────────────────────────────────────

@router.get(
    "/users",
    response_model=List[UserResponse],
    summary="List all users  [admin only]",
    responses={
        200: {"description": "Array of all registered users (passwords excluded)"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "Admin access required"},
    },
)
async def list_users(_: dict = Depends(require_admin)):
    """
    Return every registered user in the system.

    Passwords are **never** included in the response.
    Only callable by an authenticated **admin**.
    """
    users = await users_collection.find({}, {"hashed_password": 0}).to_list(length=500)
    return [user_helper(u) for u in users]


# ── Platform stats ────────────────────────────────────────────────────────────

@router.get(
    "/stats",
    response_model=AdminStats,
    summary="Platform-wide statistics  [admin only]",
    responses={
        200: {"description": "Aggregate counts for users and tasks"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "Admin access required"},
    },
)
async def get_stats(_: dict = Depends(require_admin)):
    """
    Return aggregate counts across all users and tasks.

    All counts are computed with lightweight `count_documents` calls —
    no full collection scans.
    """
    total_users, admin_users = await _count_all([
        users_collection.count_documents({}),
        users_collection.count_documents({"role": "admin"}),
    ])

    total_tasks, completed_tasks, active_tasks, todo_tasks = await _count_all([
        tasks_collection.count_documents({}),
        tasks_collection.count_documents({"status": "done"}),
        tasks_collection.count_documents({"status": "in_progress"}),
        tasks_collection.count_documents({"status": "todo"}),
    ])

    return AdminStats(
        total_users=total_users,
        admin_users=admin_users,
        regular_users=total_users - admin_users,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        active_tasks=active_tasks,
        todo_tasks=todo_tasks,
    )


async def _count_all(coros):
    """Await multiple count_documents coroutines and return results in order."""
    import asyncio
    return await asyncio.gather(*coros)


# ── Promote ───────────────────────────────────────────────────────────────────

@router.post(
    "/promote/{user_id}",
    response_model=UserResponse,
    summary="Promote a user to admin  [admin only]",
    responses={
        200: {"description": "User promoted — updated profile returned"},
        400: {"description": "User is already an admin or invalid ObjectId"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "Admin access required"},
        404: {"description": "User not found"},
    },
)
async def promote_user(
    user_id: str,
    current_admin: dict = Depends(require_admin),
):
    """
    Grant the **admin** role to an existing user.

    - Rejects if the target is already an admin (400).
    - Returns the updated `UserResponse`.
    """
    oid  = _parse_object_id(user_id)
    user = await _get_user_or_404(oid)

    if user.get("role") == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already an admin",
        )

    await users_collection.update_one({"_id": oid}, {"$set": {"role": "admin"}})
    updated = await users_collection.find_one({"_id": oid})
    logger.info("Admin %s promoted user %s", current_admin["email"], user["email"])
    return user_helper(updated)


# ── Demote ────────────────────────────────────────────────────────────────────

@router.post(
    "/demote/{user_id}",
    response_model=UserResponse,
    summary="Demote an admin back to user  [admin only]",
    responses={
        200: {"description": "Admin demoted — updated profile returned"},
        400: {"description": "Cannot demote yourself, not an admin, or invalid ObjectId"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "Admin access required"},
        404: {"description": "User not found"},
    },
)
async def demote_user(
    user_id: str,
    current_admin: dict = Depends(require_admin),
):
    """
    Revoke the **admin** role from a user (restores to **user** role).

    - An admin cannot demote themselves (400).
    - Rejects if the target does not have the admin role (400).
    """
    oid = _parse_object_id(user_id)

    if str(current_admin["_id"]) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot demote yourself",
        )

    user = await _get_user_or_404(oid)

    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have the admin role",
        )

    await users_collection.update_one({"_id": oid}, {"$set": {"role": "user"}})
    updated = await users_collection.find_one({"_id": oid})
    logger.info("Admin %s demoted user %s", current_admin["email"], user["email"])
    return user_helper(updated)


# ── Delete user ───────────────────────────────────────────────────────────────

@router.delete(
    "/user/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user account  [admin only]",
    responses={
        204: {"description": "User and all their tasks deleted"},
        400: {"description": "Cannot delete yourself or invalid ObjectId"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "Admin access required"},
        404: {"description": "User not found"},
    },
)
async def delete_user(
    user_id: str,
    current_admin: dict = Depends(require_admin),
):
    """
    Permanently delete a user account **and all tasks they own**.

    This action is irreversible.

    - An admin cannot delete their own account (400).
    - Returns **204 No Content** on success.
    """
    oid = _parse_object_id(user_id)

    if str(current_admin["_id"]) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )

    user = await _get_user_or_404(oid)

    # Delete the user's tasks first, then the user document
    task_result = await tasks_collection.delete_many({"owner_id": str(oid)})
    await users_collection.delete_one({"_id": oid})

    logger.info(
        "Admin %s deleted user %s (and %d tasks)",
        current_admin["email"],
        user["email"],
        task_result.deleted_count,
    )


# ── Allowed-email allowlist ───────────────────────────────────────────────────

@router.get(
    "/allowed-emails",
    response_model=List[AllowedEmailOut],
    summary="List all emails approved for registration  [admin only]",
)
async def list_allowed_emails(_: dict = Depends(require_admin)):
    """Return every email address currently on the registration allowlist."""
    docs = await allowed_emails_collection.find({}, {"_id": 0}).to_list(length=2000)
    return docs


@router.post(
    "/allowed-emails",
    response_model=AllowedEmailOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add an email to the registration allowlist  [admin only]",
)
async def add_allowed_email(
    body: AllowedEmailIn,
    current_admin: dict = Depends(require_admin),
):
    """
    Allow a specific email address to register an account.

    - Email is normalised to lowercase before storage.
    - Returns 409 if the email is already on the allowlist.
    """
    email = body.email.lower().strip()

    if not email.endswith("@gmail.com"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Gmail addresses (@gmail.com) can be added to the allowlist.",
        )

    if await allowed_emails_collection.find_one({"email": email}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already on the allowlist.",
        )

    doc = {
        "email":     email,
        "added_by":  current_admin["email"],
        "added_at":  datetime.now(timezone.utc),
    }
    await allowed_emails_collection.insert_one(doc)
    logger.info("Admin %s added %s to allowlist", current_admin["email"], email)
    return {k: v for k, v in doc.items() if k != "_id"}


@router.delete(
    "/allowed-emails",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove an email from the registration allowlist  [admin only]",
)
async def remove_allowed_email(
    email: str,
    current_admin: dict = Depends(require_admin),
):
    """
    Remove a specific email from the allowlist (passed as query param ?email=...).

    The corresponding user account (if any) is **not** deleted — only future
    re-registration with this address will be blocked.
    """
    email = email.lower().strip()
    result = await allowed_emails_collection.delete_one({"email": email})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found in allowlist.",
        )
    logger.info("Admin %s removed %s from allowlist", current_admin["email"], email)
