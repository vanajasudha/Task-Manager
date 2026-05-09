from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


class TaskStatus(str, Enum):
    todo        = "todo"
    in_progress = "in_progress"
    done        = "done"


class TaskPriority(str, Enum):
    low    = "low"
    medium = "medium"
    high   = "high"


class TaskCreate(BaseModel):
    """Request body for creating a new task."""
    title:       str            = Field(..., min_length=1, max_length=200, examples=["Fix login bug"])
    description: Optional[str] = Field(None, max_length=1000)
    status:      TaskStatus     = TaskStatus.todo
    priority:    TaskPriority   = TaskPriority.medium
    due_date:    Optional[datetime] = None


class TaskUpdate(BaseModel):
    """Request body for updating a task — all fields are optional (partial update)."""
    title:       Optional[str]      = Field(None, min_length=1, max_length=200)
    description: Optional[str]      = Field(None, max_length=1000)
    status:      Optional[TaskStatus]   = None
    priority:    Optional[TaskPriority] = None
    due_date:    Optional[datetime]     = None


class TaskResponse(BaseModel):
    """Shape of a single task in every API response."""
    id:          str
    title:       str
    description: Optional[str]      = None
    status:      str
    priority:    str
    due_date:    Optional[datetime] = None
    owner_id:    str
    created_at:  datetime
    updated_at:  datetime


class TaskListResponse(BaseModel):
    """
    Paginated task list returned by GET /tasks.

    Replaces the previous bare array so clients can implement pagination UI.
    Existing fields (tasks array shape) are unchanged for backward compatibility.
    """
    tasks:  List[TaskResponse]
    total:  int  = Field(..., description="Total records matching current filters (all pages)")
    page:   int  = Field(..., description="Current page number (1-indexed)")
    pages:  int  = Field(..., description="Total number of pages")
    limit:  int  = Field(..., description="Max records per page")


# ── Analytics schemas ─────────────────────────────────────────────────────────

class StatusCount(BaseModel):
    status: str
    count:  int

class PriorityCount(BaseModel):
    priority: str
    count:    int

class WeeklyDay(BaseModel):
    day:       str   # "Mon", "Tue", …
    date:      str   # "2024-01-08"
    created:   int
    completed: int

class WeeklyTrend(BaseModel):
    week:  str    # "7w ago" … "Now"
    total: int
    done:  int
    rate:  float  # 0–100 completion %

class TaskAnalytics(BaseModel):
    status_distribution:   List[StatusCount]
    priority_distribution: List[PriorityCount]
    weekly_activity:       List[WeeklyDay]    # last 7 days
    monthly_trend:         List[WeeklyTrend]  # last 8 weeks
    total_tasks:           int
    completion_rate:       float
