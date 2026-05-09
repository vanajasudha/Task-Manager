"""
Centralised exception handlers.

Call register_exception_handlers(app) once in main.py to attach all
handlers. Every error response — validation, auth, rate-limit, or
unknown crash — then shares the same JSON shape:

    {"detail": "<string or list>",  "request_id": "<8-char hex>"}

The request_id is injected by LoggingMiddleware into request.state
before any route handler runs, so every error can be correlated with
its access-log line.
"""

import logging

from bson.errors import InvalidId
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

logger = logging.getLogger(__name__)


# ── Shared response builder ───────────────────────────────────────────────────

def _err(
    status_code: int,
    detail,
    *,
    headers: dict | None = None,
    request_id: str | None = None,
) -> JSONResponse:
    content: dict = {"detail": detail}
    if request_id:
        content["request_id"] = request_id
    return JSONResponse(status_code=status_code, content=content, headers=headers or {})


def _rid(request: Request) -> str | None:
    """Pull the request-id set by LoggingMiddleware, or None if not present."""
    return getattr(request.state, "request_id", None)


# ── Handler registration ──────────────────────────────────────────────────────

def register_exception_handlers(app: FastAPI) -> None:
    """Attach all global exception handlers to *app*."""

    # ── 422 Validation error ─────────────────────────────────────────────────
    @app.exception_handler(RequestValidationError)
    async def _validation_error(request: Request, exc: RequestValidationError):
        """
        Pydantic validation failed.
        Reformat from FastAPI's nested structure into a flat list of
        {field, message} objects that are easy to display in a UI.
        """
        errors = []
        for e in exc.errors():
            # loc is a tuple like ("body", "username") — skip the "body" wrapper
            loc = [str(f) for f in e["loc"] if f != "body"]
            errors.append({
                "field":   " → ".join(loc) if loc else "request",
                "message": e["msg"],
            })
        return _err(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            errors,
            request_id=_rid(request),
        )

    # ── HTTP exceptions (401, 403, 404, 400 …) ───────────────────────────────
    @app.exception_handler(HTTPException)
    async def _http_error(request: Request, exc: HTTPException):
        """Normalise every HTTPException to the standard {detail, request_id} shape."""
        return _err(
            exc.status_code,
            exc.detail,
            headers=exc.headers,
            request_id=_rid(request),
        )

    # ── 429 Rate limit exceeded ───────────────────────────────────────────────
    @app.exception_handler(RateLimitExceeded)
    async def _rate_limit_error(request: Request, exc: RateLimitExceeded):
        return _err(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many requests — please slow down.",
            headers={"Retry-After": "60"},
            request_id=_rid(request),
        )

    # ── 400 Raw MongoDB ObjectId error ───────────────────────────────────────
    @app.exception_handler(InvalidId)
    async def _invalid_objectid(request: Request, exc: InvalidId):
        """
        Catch bson.errors.InvalidId that escapes route-level validation.
        Routes already guard with ObjectId.is_valid(), but this is a safety net.
        """
        return _err(
            status.HTTP_400_BAD_REQUEST,
            "Invalid ID format.",
            request_id=_rid(request),
        )

    # ── 500 Catch-all ─────────────────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def _unhandled_error(request: Request, exc: Exception):
        """
        Last-resort handler. Logs the full traceback so on-call engineers
        can debug from logs without ever leaking internals to clients.
        """
        logger.exception(
            "Unhandled exception  method=%s  path=%s  request_id=%s",
            request.method,
            request.url.path,
            _rid(request),
        )
        return _err(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "An unexpected error occurred. Please try again later.",
            request_id=_rid(request),
        )
