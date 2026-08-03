"""Email task placeholders — no real SMTP/provider calls yet."""

from __future__ import annotations

from typing import Any

from app.utils.helpers import job_context
from app.utils.logging import get_logger

logger = get_logger(__name__)


async def send_booking_confirmation(
    ctx: dict[str, Any],
    *,
    booking_id: str,
    organization_id: str,
    recipient_email: str,
) -> dict[str, str]:
    """Queue job: send a booking confirmation email to the guest.

    Foundation: logs intent only. A real provider (SES/SendGrid/…) plugs in later.
    """
    meta = job_context(ctx)
    logger.info(
        "email.booking_confirmation queued",
        extra={
            **meta,
            "booking_id": booking_id,
            "organization_id": organization_id,
            "recipient_email": recipient_email,
        },
    )
    logger.info(
        "email.booking_confirmation skipped (no provider configured) booking_id=%s to=%s try=%s",
        booking_id,
        recipient_email,
        meta.get("job_try"),
    )
    return {"status": "skipped", "reason": "email_provider_not_configured", "booking_id": booking_id}


async def send_checkin_reminder(
    ctx: dict[str, Any],
    *,
    booking_id: str,
    organization_id: str,
    recipient_email: str,
    check_in_date: str,
) -> dict[str, str]:
    """Queue job: remind the guest of an upcoming check-in."""
    meta = job_context(ctx)
    logger.info(
        "email.checkin_reminder skipped (no provider configured) booking_id=%s check_in=%s try=%s",
        booking_id,
        check_in_date,
        meta.get("job_try"),
    )
    return {
        "status": "skipped",
        "reason": "email_provider_not_configured",
        "booking_id": booking_id,
    }


async def send_checkout_reminder(
    ctx: dict[str, Any],
    *,
    booking_id: str,
    organization_id: str,
    recipient_email: str,
    check_out_date: str,
) -> dict[str, str]:
    """Queue job: remind the guest of an upcoming check-out."""
    meta = job_context(ctx)
    logger.info(
        "email.checkout_reminder skipped (no provider configured) booking_id=%s check_out=%s try=%s",
        booking_id,
        check_out_date,
        meta.get("job_try"),
    )
    return {
        "status": "skipped",
        "reason": "email_provider_not_configured",
        "booking_id": booking_id,
    }
