import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.modules.ai.models import (
    ConversationChannel,
    DocumentStatus,
    DocumentType,
    MessageRole,
)


class DocumentCreate(BaseModel):
    property_id: uuid.UUID
    title: str = Field(min_length=1, max_length=300)
    document_type: DocumentType = DocumentType.GENERAL
    file_url: str | None = None
    # Foundation ingestion: pass text directly until file extractors land.
    content: str = Field(min_length=1, description="Source text to chunk and embed")


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    property_id: uuid.UUID
    title: str
    document_type: DocumentType
    file_url: str | None
    status: DocumentStatus
    created_at: datetime
    updated_at: datetime
    chunk_count: int | None = None


class ChatSource(BaseModel):
    document_id: uuid.UUID
    document_title: str
    content: str
    score: float


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    property_id: uuid.UUID
    guest_id: uuid.UUID | None = None
    conversation_id: uuid.UUID | None = None
    channel: ConversationChannel = ConversationChannel.API


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
    conversation_id: uuid.UUID
    model: str


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    property_id: uuid.UUID
    guest_id: uuid.UUID | None
    channel: ConversationChannel
    created_at: datetime


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    role: MessageRole
    content: str
    created_at: datetime
    metadata: dict[str, Any] | None = None
