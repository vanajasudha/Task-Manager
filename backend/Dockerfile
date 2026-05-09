# ─────────────────────────────────────────────────────────────────────────────
# TaskFlow API — Production Dockerfile
#
# Multi-stage build:
#   Stage 1 (builder) — install Python dependencies into a virtual env
#   Stage 2 (runtime) — copy only the venv + app code; no build tools
#
# Build:  docker build -t taskflow-api .
# Run:    docker run -p 8000:8000 --env-file .env taskflow-api
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: dependency installer ────────────────────────────────────────────
FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libffi-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt


# ── Stage 2: lean runtime image ───────────────────────────────────────────────
FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/venv/bin:$PATH"

WORKDIR /app

RUN adduser --disabled-password --gecos "" --uid 1001 appuser

COPY --from=builder /venv /venv
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

# $PORT is injected by Render and Railway; defaults to 8000 locally
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --no-access-log"]
