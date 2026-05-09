import asyncio
import math
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import tasks_collection
from app.models.task_model import task_helper
from app.schemas.task_schema import (
    PriorityCount, StatusCount, TaskAnalytics,
    TaskCreate, TaskListResponse, TaskPriority,
    TaskResponse, TaskStatus, TaskUpdate,
    WeeklyDay, WeeklyTrend,
)
from app.utils.security import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

# Fields the caller is allowed to sort by
_SORT_FIELDS = {"created_at", "updated_at", "due_date", "title"}


# ── List (paginated, filtered, sorted) ───────────────────────────────────────

@router.get(
    "",
    response_model=TaskListResponse,
    summary="List tasks — paginated, filtered, sorted",
)
async def list_tasks(
    # ── Filters ────────────────────────────────────────────────────────────
    task_status: Optional[TaskStatus] = Query(
        None, alias="status",
        description="Filter by status: `todo` | `in_progress` | `done`",
    ),
    task_priority: Optional[TaskPriority] = Query(
        None, alias="priority",
        description="Filter by priority: `low` | `medium` | `high`",
    ),
    search: Optional[str] = Query(
        None, max_length=100,
        description="Case-insensitive substring search in **title** and **description**",
    ),
    # ── Sorting ─────────────────────────────────────────────────────────────
    sort_by: str = Query(
        "created_at",
        description="Field to sort by: `created_at` | `updated_at` | `due_date` | `title`",
    ),
    sort_order: str = Query(
        "desc",
        description="Sort direction: `asc` | `desc`",
    ),
    # ── Pagination ───────────────────────────────────────────────────────────
    skip: int = Query(0,  ge=0,  description="Number of records to skip (offset)"),
    limit: int = Query(20, ge=1, le=100, description="Max records to return per page"),
    # ── Auth ─────────────────────────────────────────────────────────────────
    current_user: dict = Depends(get_current_user),
):
    """
    Return a paginated, optionally filtered and sorted list of tasks.

    **RBAC**
    - **Admin**: sees every task in the system.
    - **User**: sees only their own tasks.

    **Filtering** (combinable):
    - `?status=in_progress` — only in-progress tasks
    - `?priority=high` — only high-priority tasks
    - `?search=login` — tasks whose title or description contains "login"

    **Sorting**: `?sort_by=due_date&sort_order=asc`

    **Pagination**: `?skip=20&limit=20` — second page of 20 results

    Response includes `total`, `page`, `pages`, and `limit` for building
    pagination controls on the client.
    """
    # ── Build MongoDB filter ────────────────────────────────────────────────
    query: dict = {}

    if current_user.get("role") != "admin":
        query["owner_id"] = str(current_user["_id"])

    if task_status:
        query["status"] = task_status.value
    if task_priority:
        query["priority"] = task_priority.value
    if search:
        query["$or"] = [
            {"title":       {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    # ── Validate + apply sort ───────────────────────────────────────────────
    if sort_by not in _SORT_FIELDS:
        sort_by = "created_at"
    direction = -1 if sort_order == "desc" else 1

    # ── Count + fetch ───────────────────────────────────────────────────────
    total = await tasks_collection.count_documents(query)
    pages = max(1, math.ceil(total / limit))
    page  = (skip // limit) + 1

    raw = (
        await tasks_collection
        .find(query)
        .sort(sort_by, direction)
        .skip(skip)
        .limit(limit)
        .to_list(length=limit)
    )

    return {
        "tasks": [task_helper(t) for t in raw],
        "total": total,
        "page":  page,
        "pages": pages,
        "limit": limit,
    }


# ── Analytics ────────────────────────────────────────────────────────────────
# IMPORTANT: must be declared before /{task_id} so FastAPI doesn't interpret
# the literal path segment "analytics" as a task_id path parameter.

@router.get(
    "/analytics",
    response_model=TaskAnalytics,
    summary="Aggregated analytics data for charts",
)
async def get_analytics(current_user: dict = Depends(get_current_user)):
    """
    Return pre-aggregated data for the four dashboard charts:
    - Status distribution (pie)
    - Priority distribution (bar)
    - Weekly activity — created vs completed per day, last 7 days (bar)
    - 8-week productivity trend — completion rate per week (area)

    All DB calls run concurrently via asyncio.gather.
    """
    base_q: dict = {}
    if current_user.get("role") != "admin":
        base_q["owner_id"] = str(current_user["_id"])

    now             = datetime.now(timezone.utc)
    seven_days_ago  = now - timedelta(days=7)
    eight_weeks_ago = now - timedelta(weeks=8)

    # ── Concurrent DB calls ───────────────────────────────────────────────────
    status_docs, priority_docs, week_tasks, trend_tasks = await asyncio.gather(
        tasks_collection.aggregate([
            {"$match": base_q},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        ]).to_list(length=10),

        tasks_collection.aggregate([
            {"$match": base_q},
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
        ]).to_list(length=10),

        tasks_collection.find(
            {**base_q, "created_at": {"$gte": seven_days_ago}},
            {"status": 1, "created_at": 1, "updated_at": 1},
        ).to_list(length=500),

        tasks_collection.find(
            {**base_q, "created_at": {"$gte": eight_weeks_ago}},
            {"status": 1, "created_at": 1},
        ).to_list(length=1000),
    )

    # ── Status distribution ───────────────────────────────────────────────────
    sm = {d["_id"]: d["count"] for d in status_docs}
    status_distribution = [
        StatusCount(status="todo",        count=sm.get("todo", 0)),
        StatusCount(status="in_progress", count=sm.get("in_progress", 0)),
        StatusCount(status="done",        count=sm.get("done", 0)),
    ]

    # ── Priority distribution ─────────────────────────────────────────────────
    pm = {d["_id"]: d["count"] for d in priority_docs}
    priority_distribution = [
        PriorityCount(priority="Low",    count=pm.get("low", 0)),
        PriorityCount(priority="Medium", count=pm.get("medium", 0)),
        PriorityCount(priority="High",   count=pm.get("high", 0)),
    ]

    # ── Weekly activity (last 7 days) ─────────────────────────────────────────
    created_by_day: dict   = defaultdict(int)
    completed_by_day: dict = defaultdict(int)

    for task in week_tasks:
        c = task["created_at"]
        if c.tzinfo is None:
            c = c.replace(tzinfo=timezone.utc)
        created_by_day[c.strftime("%Y-%m-%d")] += 1

        if task.get("status") == "done":
            u = task.get("updated_at", c)
            if u.tzinfo is None:
                u = u.replace(tzinfo=timezone.utc)
            if u >= seven_days_ago:
                completed_by_day[u.strftime("%Y-%m-%d")] += 1

    weekly_activity = []
    for i in range(7):
        day     = (now - timedelta(days=6 - i)).date()
        day_str = day.isoformat()
        weekly_activity.append(WeeklyDay(
            day=day.strftime("%a"),
            date=day_str,
            created=created_by_day.get(day_str, 0),
            completed=completed_by_day.get(day_str, 0),
        ))

    # ── 8-week productivity trend ─────────────────────────────────────────────
    buckets: dict = defaultdict(lambda: {"total": 0, "done": 0})
    for task in trend_tasks:
        c = task["created_at"]
        if c.tzinfo is None:
            c = c.replace(tzinfo=timezone.utc)
        bucket = min(int((now - c).days // 7), 7)
        buckets[bucket]["total"] += 1
        if task.get("status") == "done":
            buckets[bucket]["done"] += 1

    monthly_trend = []
    for i in range(7, -1, -1):        # oldest → newest
        d     = buckets[i]
        label = "Now" if i == 0 else f"{i}w ago"
        monthly_trend.append(WeeklyTrend(
            week=label,
            total=d["total"],
            done=d["done"],
            rate=round(d["done"] / d["total"] * 100, 1) if d["total"] else 0.0,
        ))

    # ── Totals ────────────────────────────────────────────────────────────────
    total_tasks     = sum(s.count for s in status_distribution)
    completion_rate = round(sm.get("done", 0) / total_tasks * 100, 1) if total_tasks else 0.0

    return TaskAnalytics(
        status_distribution=status_distribution,
        priority_distribution=priority_distribution,
        weekly_activity=weekly_activity,
        monthly_trend=monthly_trend,
        total_tasks=total_tasks,
        completion_rate=completion_rate,
    )


# ── Create ────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a task owned by the currently authenticated user."""
    now = datetime.now(timezone.utc)
    doc = {
        **task_data.model_dump(),
        "owner_id":   str(current_user["_id"]),
        "created_at": now,
        "updated_at": now,
    }
    result   = await tasks_collection.insert_one(doc)
    new_task = await tasks_collection.find_one({"_id": result.inserted_id})
    return task_helper(new_task)


# ── Read ──────────────────────────────────────────────────────────────────────

@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get a single task",
)
async def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Fetch one task by ID. Users can only fetch their own; admins can fetch any."""
    task = await _get_task_or_404(task_id)
    _assert_access(task, current_user)
    return task_helper(task)


# ── Update ────────────────────────────────────────────────────────────────────

@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update a task (partial)",
)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Partially update a task — only fields present in the request body are changed.
    Users can only update their own tasks; admins can update any.
    """
    task = await _get_task_or_404(task_id)
    _assert_access(task, current_user)

    updates = task_data.model_dump(exclude_unset=True)
    updates["updated_at"] = datetime.now(timezone.utc)

    await tasks_collection.update_one({"_id": ObjectId(task_id)}, {"$set": updates})
    updated = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    return task_helper(updated)


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task",
)
async def delete_task(
    task_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Permanently delete a task. Users can only delete their own; admins can delete any."""
    task = await _get_task_or_404(task_id)
    _assert_access(task, current_user)
    await tasks_collection.delete_one({"_id": ObjectId(task_id)})


# ── Private helpers ───────────────────────────────────────────────────────────

async def _get_task_or_404(task_id: str) -> dict:
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid task ID format",
        )
    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


def _assert_access(task: dict, current_user: dict) -> None:
    if current_user.get("role") == "admin":
        return
    if task.get("owner_id") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this task",
        )
