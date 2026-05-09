"""
Request-level middleware.

LoggingMiddleware  — structured access log (one line in, one line out)
TimingMiddleware   — adds X-Process-Time header to every response

Both are registered in main.py.  Starlette executes middleware in
reverse-registration order (last added = outermost), so register
TimingMiddleware first, LoggingMiddleware second — that way
LoggingMiddleware wraps the timed call and can log the final duration.
"""

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

access_logger = logging.getLogger("api.access")

# Paths that produce noise without value in access logs
_SILENT_PATHS = frozenset({"/health", "/", "/docs", "/redoc", "/openapi.json"})


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Per-request structured access log.

    Attaches a short request_id to request.state so exception handlers
    and downstream code can correlate log lines with error responses.

    Log format (two lines per request):
        → GET  /api/v1/tasks  [a3f91c2b]  ip=127.0.0.1
        ← 200  GET  /api/v1/tasks  [a3f91c2b]  12.4ms
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Assign a unique ID to this request — readable in logs and error JSON
        request.state.request_id = uuid.uuid4().hex[:8]

        if request.url.path in _SILENT_PATHS:
            return await call_next(request)

        start = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"

        access_logger.info(
            "→ %-6s %s  [%s]  ip=%s",
            request.method,
            request.url.path,
            request.state.request_id,
            client_ip,
        )

        response = await call_next(request)

        elapsed_ms = (time.perf_counter() - start) * 1000
        access_logger.info(
            "← %-3d  %-6s %s  [%s]  %.1fms",
            response.status_code,
            request.method,
            request.url.path,
            request.state.request_id,
            elapsed_ms,
        )

        return response


class TimingMiddleware(BaseHTTPMiddleware):
    """
    Adds an X-Process-Time header (in milliseconds) to every response.

    Useful for client-side performance monitoring and for surfacing
    slow endpoints in browser DevTools / Postman without needing logs.

    Example response header:
        X-Process-Time: 14.73ms
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Process-Time"] = f"{elapsed_ms:.2f}ms"
        return response
