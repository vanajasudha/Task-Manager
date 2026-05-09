"""
MongoDB client and collection handles.

Motor creates a single connection pool per AsyncIOMotorClient — the same
client is reused for every request.  Calling AsyncIOMotorClient(uri)
does NOT open a socket immediately; connections are established lazily on
the first operation, so importing this module is always safe.

Index strategy (see create_indexes for details):
- Compound indexes are ordered (equality filter first, then range/sort)
  so MongoDB can serve both the filter AND the sort from one index scan.
- All task indexes are scoped to owner_id so user-data isolation is
  enforced at the index level, not just in query predicates.
"""

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

logger = logging.getLogger(__name__)

# ── Client + database ─────────────────────────────────────────────────────────

client: AsyncIOMotorClient = AsyncIOMotorClient(
    settings.MONGO_URI,
    # Fail fast if the cluster is unreachable during startup
    serverSelectionTimeoutMS=5_000,
    # Keep a connection alive for up to 30 s of inactivity
    socketTimeoutMS=30_000,
)

db: AsyncIOMotorDatabase = client[settings.MONGO_DB_NAME]

users_collection          = db["users"]
tasks_collection          = db["tasks"]
allowed_emails_collection = db["allowed_emails"]


# ── Index creation ────────────────────────────────────────────────────────────

async def create_indexes() -> None:
    """
    Idempotently create all required MongoDB indexes.

    Motor's create_index is a no-op if an identical index already exists,
    so calling this on every restart is safe and cheap.

    Verify indexes in the MongoDB shell with:
        db.tasks.getIndexes()
        db.users.getIndexes()
    """
    logger.info("Creating / verifying MongoDB indexes …")

    # ── Users ─────────────────────────────────────────────────────────────
    # Unique email prevents duplicate registrations at the database layer,
    # providing a second line of defence after the application-level check.
    # No explicit name — lets MongoDB keep the existing auto-generated "email_1"
    # index if it already exists, avoiding an IndexOptionsConflict on restart.
    await users_collection.create_index("email", unique=True)

    # Fast username lookups (profile pages, admin search)
    await users_collection.create_index("username")

    # ── Allowed emails (registration allowlist) ───────────────────────────
    await allowed_emails_collection.create_index("email", unique=True)

    # ── Tasks ─────────────────────────────────────────────────────────────
    # Default query: "show my tasks, newest first"
    await tasks_collection.create_index(
        [("owner_id", 1), ("created_at", -1)],
        name="tasks_owner_created_desc",
    )

    # Status filter: "show my in-progress tasks"
    await tasks_collection.create_index(
        [("owner_id", 1), ("status", 1)],
        name="tasks_owner_status",
    )

    # Priority filter: "show my high-priority tasks"
    await tasks_collection.create_index(
        [("owner_id", 1), ("priority", 1)],
        name="tasks_owner_priority",
    )

    # Combined filter: status + priority simultaneously
    await tasks_collection.create_index(
        [("owner_id", 1), ("status", 1), ("priority", 1)],
        name="tasks_owner_status_priority",
    )

    # Due-date sort and future date-range queries
    await tasks_collection.create_index(
        [("owner_id", 1), ("due_date", 1)],
        name="tasks_owner_due_date",
    )

    # "Recently modified" sort
    await tasks_collection.create_index(
        [("owner_id", 1), ("updated_at", -1)],
        name="tasks_owner_updated_desc",
    )

    logger.info("MongoDB indexes OK")
