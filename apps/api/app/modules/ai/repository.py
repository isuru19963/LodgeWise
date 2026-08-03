import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.ai.models import (
    Conversation,
    DocumentChunk,
    DocumentStatus,
    KnowledgeDocument,
)


async def list_documents(
    session: AsyncSession,
    org_id: uuid.UUID,
    property_id: uuid.UUID | None = None,
) -> list[KnowledgeDocument]:
    query = (
        select(KnowledgeDocument)
        .where(KnowledgeDocument.organization_id == org_id)
        .options(selectinload(KnowledgeDocument.chunks))
        .order_by(KnowledgeDocument.created_at.desc())
    )
    if property_id is not None:
        query = query.where(KnowledgeDocument.property_id == property_id)
    result = await session.scalars(query)
    return list(result)


async def get_document(
    session: AsyncSession, org_id: uuid.UUID, document_id: uuid.UUID
) -> KnowledgeDocument | None:
    return await session.scalar(
        select(KnowledgeDocument)
        .where(
            KnowledgeDocument.id == document_id,
            KnowledgeDocument.organization_id == org_id,
        )
        .options(selectinload(KnowledgeDocument.chunks))
    )


async def get_conversation(
    session: AsyncSession, org_id: uuid.UUID, conversation_id: uuid.UUID
) -> Conversation | None:
    return await session.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.organization_id == org_id,
        )
    )


async def similarity_search(
    session: AsyncSession,
    *,
    org_id: uuid.UUID,
    property_id: uuid.UUID,
    query_embedding: list[float],
    limit: int = 5,
) -> list[tuple[DocumentChunk, KnowledgeDocument, float]]:
    """Cosine-distance nearest neighbours, scoped to tenant + property."""
    distance = DocumentChunk.embedding.cosine_distance(query_embedding)
    rows = await session.execute(
        select(DocumentChunk, KnowledgeDocument, distance.label("distance"))
        .join(KnowledgeDocument, DocumentChunk.document_id == KnowledgeDocument.id)
        .where(
            DocumentChunk.organization_id == org_id,
            KnowledgeDocument.organization_id == org_id,
            KnowledgeDocument.property_id == property_id,
            KnowledgeDocument.status == DocumentStatus.READY,
        )
        .order_by(distance)
        .limit(limit)
    )
    results: list[tuple[DocumentChunk, KnowledgeDocument, float]] = []
    for chunk, document, dist in rows.all():
        score = 1.0 / (1.0 + float(dist))
        results.append((chunk, document, score))
    return results
