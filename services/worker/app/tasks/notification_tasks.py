"""In-app / staff notification task placeholders."""

from __future__ import annotations

from typing import Any

from app.utils.helpers import job_context
from app.utils.logging import get_logger

logger = get_logger(__name__)


async def create_notification(
    ctx: dict[str, Any],
    *,
    organization_id: str,
    user_id: str | None = None,
    title: str,
    body: str,
    category: str = "general",
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Queue job: persist an in-app notification for a user or org.

    Foundation: logs the payload. Persistence / push delivery lands later.
    """
    meta = job_context(ctx)
    logger.info(
        "notification.create skipped (store not wired) org=%s user=%s category=%s title=%s try=%s",
        organization_id,
        user_id,
        category,
        title,
        meta.get("job_try"),
    )
    return {
        "status": "skipped",
        "reason": "notification_store_not_configured",
        "organization_id": organization_id,
        "category": category,
        "metadata": metadata or {},
    }


async def send_staff_alert(
    ctx: dict[str, Any],
    *,
    organization_id: str,
    property_id: str | None = None,
    alert_type: str,
    message: str,
    severity: str = "info",
) -> dict[str, str]:
    """Queue job: alert property staff (desk / housekeeping / managers).

    Foundation: structured log only — no SMS/push/email fan-out yet.
    """
    meta = job_context(ctx)
    logger.info(
        "notification.staff_alert skipped (channel not wired) org=%s property=%s type=%s severity=%s try=%s message=%s",
        organization_id,
        property_id,
        alert_type,
        severity,
        meta.get("job_try"),
        message,
    )
    return {
        "status": "skipped",
        "reason": "alert_channel_not_configured",
        "alert_type": alert_type,
        "severity": severity,
    }
