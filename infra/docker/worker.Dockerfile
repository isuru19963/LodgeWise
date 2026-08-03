# =============================================================================
# Lodgwise Worker — development image
#
# Built from the repository root:
#   docker compose build worker
#
# Runs the arq worker against Redis. Source is bind-mounted in compose for
# fast iteration; restart the container after task changes (or use --watch).
# =============================================================================

FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=1 \
    PYTHONPATH=/app

WORKDIR /app

COPY services/worker/requirements.txt ./
RUN uv pip install --system -r requirements.txt

COPY services/worker/ ./

CMD ["arq", "app.main.WorkerSettings"]
