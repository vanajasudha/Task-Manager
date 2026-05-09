def user_helper(user: dict) -> dict:
    """Convert a raw MongoDB user document into a clean dict for the API response."""
    return {
        "id":            str(user["_id"]),
        "username":      user["username"],
        "email":         user["email"],
        "role":          user.get("role", "user"),
        "picture":       user.get("picture"),
        "auth_provider": user.get("auth_provider", "local"),
    }
