"""Shared helpers for background tasks."""

from __future__ import annotations

from typing import Any


def job_context(ctx: dict[str, Any]) -> dict[str, Any]:
    """Extract stable identifiers from an arq job context for log lines."""
    return {
        "job_id": str(ctx.get("job_id", "")),
        "job_try": ctx.get("job_try"),
    }
