def task_helper(task: dict) -> dict:
    """Convert a raw MongoDB task document into a clean dict for the API response."""
    return {
        "id": str(task["_id"]),
        "title": task["title"],
        "description": task.get("description"),
        "status": task.get("status", "todo"),
        "priority": task.get("priority", "medium"),
        "due_date": task.get("due_date"),
        "owner_id": str(task["owner_id"]),
        "created_at": task["created_at"],
        "updated_at": task["updated_at"],
    }
