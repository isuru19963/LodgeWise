"""AI background task placeholders — no real model / embedding calls yet."""

from __future__ import annotations

from typing import Any

from app.utils.helpers import job_context
from app.utils.logging import get_logger

logger = get_logger(__name__)


async def process_document(
    ctx: dict[str, Any],
    *,
    document_id: str,
    organization_id: str,
    property_id: str,
) -> dict[str, str]:
    """Queue job: run the knowledge-document ingestion pipeline asynchronously.

    Foundation: logs intent. Will call apps/api (or services/ai) ingestion later —
    extract → chunk → embed → store.
    """
    meta = job_context(ctx)
    logger.info(
        "ai.process_document skipped (pipeline not wired) document_id=%s org=%s property=%s try=%s",
        document_id,
        organization_id,
        property_id,
        meta.get("job_try"),
    )
    return {
        "status": "skipped",
        "reason": "ai_pipeline_not_configured",
        "document_id": document_id,
    }


async def generate_embeddings(
    ctx: dict[str, Any],
    *,
    document_id: str,
    organization_id: str,
    chunk_ids: list[str] | None = None,
) -> dict[str, Any]:
    """Queue job: (re)generate embeddings for document chunks.

    Foundation: logs intent. Real EmbeddingProvider calls land with services/ai.
    """
    meta = job_context(ctx)
    logger.info(
        "ai.generate_embeddings skipped (provider not wired) document_id=%s org=%s chunks=%s try=%s",
        document_id,
        organization_id,
        len(chunk_ids or []),
        meta.get("job_try"),
    )
    return {
        "status": "skipped",
        "reason": "embedding_provider_not_configured",
        "document_id": document_id,
        "chunk_count": len(chunk_ids or []),
    }
