"""AI knowledge-base service: ingestion + retrieval pipelines.

Pipeline shapes (providers are abstracted — no vendor SDKs here):

  Upload → extract text → split chunks → generate embeddings → store vectors
  Question → embed → vector search → retrieve chunks → LLM response
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.ai import repository
from app.modules.ai.embeddings import get_embedding_provider
from app.modules.ai.llm import RetrievedChunk, get_llm_provider
from app.modules.ai.models import (
    Conversation,
    DocumentChunk,
    DocumentStatus,
    KnowledgeDocument,
    Message,
    MessageRole,
)
from app.modules.ai.schemas import (
    ChatRequest,
    ChatResponse,
    ChatSource,
    DocumentCreate,
    DocumentResponse,
)
from app.modules.auth.dependencies import TenantContext
from app.modules.guests import repository as guests_repository
from app.modules.properties import repository as properties_repository

_CHUNK_SIZE = 500
_CHUNK_OVERLAP = 50
_TOP_K = 5


def _split_chunks(text: str, size: int = _CHUNK_SIZE, overlap: int = _CHUNK_OVERLAP) -> list[str]:
    """Simple character-window splitter — replace with tiktoken/semantic later."""
    cleaned = " ".join(text.split())
    if not cleaned:
        return []
    if len(cleaned) <= size:
        return [cleaned]
    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(start + size, len(cleaned))
        chunks.append(cleaned[start:end])
        if end == len(cleaned):
            break
        start = max(end - overlap, start + 1)
    return chunks


async def list_documents(
    session: AsyncSession, tenant: TenantContext, property_id: uuid.UUID | None
) -> list[DocumentResponse]:
    docs = await repository.list_documents(session, tenant.organization_id, property_id)
    return [
        DocumentResponse(
            id=d.id,
            organization_id=d.organization_id,
            property_id=d.property_id,
            title=d.title,
            document_type=d.document_type,
            file_url=d.file_url,
            status=d.status,
            created_at=d.created_at,
            updated_at=d.updated_at,
            chunk_count=len(d.chunks),
        )
        for d in docs
    ]


async def get_document(
    session: AsyncSession, tenant: TenantContext, document_id: uuid.UUID
) -> DocumentResponse:
    doc = await repository.get_document(session, tenant.organization_id, document_id)
    if doc is None:
        raise NotFoundError("Document not found")
    return DocumentResponse(
        id=doc.id,
        organization_id=doc.organization_id,
        property_id=doc.property_id,
        title=doc.title,
        document_type=doc.document_type,
        file_url=doc.file_url,
        status=doc.status,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        chunk_count=len(doc.chunks),
    )


async def ingest_document(
    session: AsyncSession, tenant: TenantContext, data: DocumentCreate
) -> DocumentResponse:
    """Run the ingestion pipeline synchronously for the foundation.

    Steps: validate property → create doc (PROCESSING) → extract (content field
    for now) → split → embed → store → mark READY (or FAILED).
    """
    if await properties_repository.get_property(
        session, tenant.organization_id, data.property_id
    ) is None:
        raise NotFoundError("Property not found")

    document = KnowledgeDocument(
        organization_id=tenant.organization_id,
        property_id=data.property_id,
        title=data.title,
        document_type=data.document_type,
        file_url=data.file_url,
        status=DocumentStatus.PROCESSING,
    )
    session.add(document)
    await session.flush()

    try:
        # Extract — foundation uses the provided content; file_url extractors later.
        text = data.content.strip()
        pieces = _split_chunks(text)
        if not pieces:
            raise ConflictError("Document content is empty after extraction")

        embedder = get_embedding_provider()
        vectors = await embedder.embed(pieces)

        for index, (piece, vector) in enumerate(zip(pieces, vectors, strict=True)):
            session.add(
                DocumentChunk(
                    organization_id=tenant.organization_id,
                    document_id=document.id,
                    content=piece,
                    embedding=vector,
                    chunk_metadata={
                        "index": index,
                        "document_type": data.document_type.value,
                        "title": data.title,
                    },
                )
            )
        document.status = DocumentStatus.READY
    except ConflictError:
        document.status = DocumentStatus.FAILED
        await session.commit()
        raise
    except Exception:
        document.status = DocumentStatus.FAILED
        await session.commit()
        raise

    await session.commit()
    return await get_document(session, tenant, document.id)


async def chat(
    session: AsyncSession, tenant: TenantContext, data: ChatRequest
) -> ChatResponse:
    """Retrieval pipeline: embed question → vector search → LLM → persist turns."""
    if await properties_repository.get_property(
        session, tenant.organization_id, data.property_id
    ) is None:
        raise NotFoundError("Property not found")

    if data.guest_id is not None:
        if await guests_repository.get_guest(
            session, tenant.organization_id, data.guest_id
        ) is None:
            raise NotFoundError("Guest not found")

    if data.conversation_id is not None:
        conversation = await repository.get_conversation(
            session, tenant.organization_id, data.conversation_id
        )
        if conversation is None or conversation.property_id != data.property_id:
            raise NotFoundError("Conversation not found")
    else:
        conversation = Conversation(
            organization_id=tenant.organization_id,
            property_id=data.property_id,
            guest_id=data.guest_id,
            channel=data.channel,
        )
        session.add(conversation)
        await session.flush()

    session.add(
        Message(
            organization_id=tenant.organization_id,
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=data.message,
        )
    )

    embedder = get_embedding_provider()
    [query_vector] = await embedder.embed([data.message])

    hits = await repository.similarity_search(
        session,
        org_id=tenant.organization_id,
        property_id=data.property_id,
        query_embedding=query_vector,
        limit=_TOP_K,
    )

    retrieved = [
        RetrievedChunk(
            document_id=str(document.id),
            document_title=document.title,
            content=chunk.content,
            score=score,
        )
        for chunk, document, score in hits
    ]

    llm = get_llm_provider()
    result = await llm.generate(question=data.message, chunks=retrieved)

    session.add(
        Message(
            organization_id=tenant.organization_id,
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=result.answer,
        )
    )
    await session.commit()

    sources = [
        ChatSource(
            document_id=uuid.UUID(c.document_id),
            document_title=c.document_title,
            content=c.content,
            score=round(c.score, 4),
        )
        for c in retrieved
    ]
    return ChatResponse(
        answer=result.answer,
        sources=sources,
        conversation_id=conversation.id,
        model=result.model,
    )
