"""
Application entry point.

Wires together every production concern in one place:
  - Structured logging (configure once, propagate everywhere)
  - Middleware stack (timing → logging → CORS)
  - Rate limiting (slowapi, per-IP sliding window)
  - Centralised exception handlers
  - Database startup / index creation
  - Routers
  - Health + liveness endpoints
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.database import create_indexes, db
from app.exceptions import register_exception_handlers
from app.middleware.logging import LoggingMiddleware, TimingMiddleware
from app.routes import admin, auth, tasks
from app.utils.rate_limit import limiter


# ── Logging configuration ─────────────────────────────────────────────────────

def _configure_logging() -> None:
    """
    One-time logging setup.  All loggers in the app inherit this config.

    Format includes timestamp, level, logger name and message — enough
    context to reconstruct what happened from a log dump without any
    external tooling.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s  %(levelname)-8s  %(name)-30s  %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    # Motor and pymongo are very chatty at DEBUG level
    logging.getLogger("motor").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


_configure_logging()
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Starting %s v%s  [env=%s]",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.APP_ENV,
    )
    try:
        await create_indexes()
        logger.info("✓ MongoDB indexes verified")
    except Exception as exc:
        # Log but don't abort — DB might be temporarily unreachable at boot
        logger.warning("MongoDB startup warning: %s", exc)

    yield  # ← server is running

    logger.info("Shutting down %s", settings.APP_NAME)
    # Motor's connection pool is closed automatically on process exit


# ── Application factory ───────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description=(
            "A scalable Task Management REST API built with FastAPI and MongoDB.\n\n"
            "**Features**: JWT authentication · bcrypt password hashing · "
            "role-based access control (user / admin) · full task CRUD · "
            "pagination · filtering · sorting"
        ),
        version=settings.APP_VERSION,
        # Hide interactive docs in production to reduce attack surface
        docs_url="/docs"  if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
        # Override FastAPI's default validation error response so it matches
        # our standard {detail, request_id} shape (handled in exceptions.py)
        separate_input_output_schemas=False,
    )

    # ── Middleware stack ──────────────────────────────────────────────────────
    # Starlette applies middleware in REVERSE registration order.
    # Registration order here:  TimingMiddleware → LoggingMiddleware → CORS
    # Execution order (outermost first):  CORS → LoggingMiddleware → TimingMiddleware
    #
    # LoggingMiddleware must be outermost so it can log the final status code
    # after CORS and rate-limit headers are already written.

    app.add_middleware(TimingMiddleware)   # innermost — measures pure handler time

    app.add_middleware(LoggingMiddleware)  # outer — logs after status code is set

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,   # env-controlled, not wildcard "*"
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"],
        expose_headers=["X-Process-Time"],      # let clients read timing header
    )

    # ── Rate limiting ─────────────────────────────────────────────────────────
    # SlowAPIMiddleware applies the limiter's default_limits to every request.
    # Individual routes can override with @limiter.limit("N/period").
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    # ── Exception handlers ────────────────────────────────────────────────────
    register_exception_handlers(app)

    # ── Routers ───────────────────────────────────────────────────────────────
    API_PREFIX = "/api/v1"
    app.include_router(auth.router,  prefix=API_PREFIX)
    app.include_router(tasks.router, prefix=API_PREFIX)
    app.include_router(admin.router, prefix=API_PREFIX)

    return app


app = create_app()


# ── Health endpoints ──────────────────────────────────────────────────────────

@app.get(
    "/",
    tags=["Health"],
    summary="Liveness probe",
    response_description="Returns 200 when the process is alive",
)
async def root():
    """
    Liveness probe — confirms the process is running.
    Does NOT check the database.  Use `/health` for a full readiness check.
    """
    return {
        "status": "ok",
        "message": f"{settings.APP_NAME} is running",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "docs": "/docs" if not settings.is_production else "disabled in production",
    }


@app.get(
    "/health",
    tags=["Health"],
    summary="Readiness probe",
    response_description="200 healthy / 503 unhealthy",
)
async def health_check():
    """
    Readiness probe — verifies the app **and** the database are operational.

    Returns **200** when healthy, **503** when the database is unreachable.

    Kubernetes / Docker Compose readiness probes should hit this endpoint.
    Liveness probes can use `GET /` which never hits the database.
    """
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception as exc:
        logger.error("Health check DB ping failed: %s", exc)
        db_status = "unavailable"

    healthy = db_status == "connected"
    return JSONResponse(
        status_code=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status":      "healthy" if healthy else "unhealthy",
            "version":     settings.APP_VERSION,
            "environment": settings.APP_ENV,
            "database":    db_status,
        },
    )
