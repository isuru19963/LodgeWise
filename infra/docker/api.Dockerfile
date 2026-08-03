# =============================================================================
# Lodgwise API — development image
#
# Built from the repository root:
#   docker compose build api
#
# Development-focused: dependencies are baked into the image, source code is
# bind-mounted by docker-compose and served with uvicorn --reload. A separate
# multi-stage production image will be added when deployment work begins.
# =============================================================================

FROM python:3.13-slim

# uv for fast, reproducible dependency installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=1

WORKDIR /app

# Install dependencies first so this layer caches until pyproject.toml changes.
COPY apps/api/pyproject.toml ./
RUN uv pip install --system -r pyproject.toml

# Copy the application source. In development docker-compose bind-mounts
# ./apps/api over /app, so this copy only matters for images run standalone.
COPY apps/api/ ./

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
