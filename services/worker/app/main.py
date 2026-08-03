"""Lodgwise AI background worker — arq + Redis.

Run:
  arq app.main.WorkerSettings
"""

from __future__ import annotations

from typing import Any

from app.config import get_settings
from app.queue.connection import redis_settings
from app.tasks import ai_tasks, email_tasks, notification_tasks
from app.utils.logging import get_logger, setup_logging

logger = get_logger(__name__)
_settings = get_settings()


async def on_startup(ctx: dict[str, Any]) -> None:
    setup_logging()
    logger.info(
        "worker.startup environment=%s redis=%s max_jobs=%s max_tries=%s",
        _settings.environment,
        _settings.redis_url,
        _settings.worker_max_jobs,
        _settings.worker_max_tries,
    )
    ctx["settings"] = _settings


async def on_shutdown(ctx: dict[str, Any]) -> None:
    logger.info("worker.shutdown")


class WorkerSettings:
    """arq worker configuration.

    Retries: `max_tries` + `retry_jobs=True`. Tasks may also `raise Retry(defer=…)`
    for backoff. Keep every task idempotent.
    """

    functions = [
        email_tasks.send_booking_confirmation,
        email_tasks.send_checkin_reminder,
        email_tasks.send_checkout_reminder,
        notification_tasks.create_notification,
        notification_tasks.send_staff_alert,
        ai_tasks.process_document,
        ai_tasks.generate_embeddings,
    ]
    on_startup = on_startup
    on_shutdown = on_shutdown
    redis_settings = redis_settings()
    max_jobs = _settings.worker_max_jobs
    job_timeout = _settings.worker_job_timeout_seconds
    max_tries = _settings.worker_max_tries
    retry_jobs = True
