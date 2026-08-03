import uuid

from fastapi import APIRouter, Query, status

from app.models import UserRole
from app.modules.auth.dependencies import CurrentTenant, TenantDB, require_role
from app.modules.ai import service
from app.modules.ai.schemas import (
    ChatRequest,
    ChatResponse,
    DocumentCreate,
    DocumentResponse,
)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post(
    "/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_role(UserRole.MANAGER)],
)
async def create_document(
    data: DocumentCreate, tenant: CurrentTenant, session: TenantDB
) -> DocumentResponse:
    """Ingest a knowledge document: extract → chunk → embed → store."""
    return await service.ingest_document(session, tenant, data)


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    tenant: CurrentTenant,
    session: TenantDB,
    property_id: uuid.UUID | None = Query(default=None),
) -> list[DocumentResponse]:
    return await service.list_documents(session, tenant, property_id)


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID, tenant: CurrentTenant, session: TenantDB
) -> DocumentResponse:
    return await service.get_document(session, tenant, document_id)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatRequest, tenant: CurrentTenant, session: TenantDB
) -> ChatResponse:
    """RAG chat: vector search over property knowledge → LLM answer."""
    return await service.chat(session, tenant, data)
