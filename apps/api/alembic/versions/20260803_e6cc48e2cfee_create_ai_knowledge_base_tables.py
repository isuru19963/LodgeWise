"""create ai knowledge base tables

Revision ID: e6cc48e2cfee
Revises: e458f94ad144
Create Date: 2026-08-03 18:22:24.398875+00:00
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql


revision: str = 'e6cc48e2cfee'
down_revision: str | None = 'e458f94ad144'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    op.create_table('conversations',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('organization_id', sa.UUID(), nullable=False),
    sa.Column('property_id', sa.UUID(), nullable=False),
    sa.Column('guest_id', sa.UUID(), nullable=True),
    sa.Column('channel', sa.Enum('in_app', 'email', 'sms', 'whatsapp', 'api', name='conversation_channel'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['guest_id'], ['guests.id'], name=op.f('fk_conversations_guest_id_guests'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name=op.f('fk_conversations_organization_id_organizations'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], name=op.f('fk_conversations_property_id_properties'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_conversations'))
    )
    op.create_index(op.f('ix_conversations_guest_id'), 'conversations', ['guest_id'], unique=False)
    op.create_index(op.f('ix_conversations_organization_id'), 'conversations', ['organization_id'], unique=False)
    op.create_index(op.f('ix_conversations_property_id'), 'conversations', ['property_id'], unique=False)
    op.create_table('knowledge_documents',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('organization_id', sa.UUID(), nullable=False),
    sa.Column('property_id', sa.UUID(), nullable=False),
    sa.Column('title', sa.String(length=300), nullable=False),
    sa.Column('document_type', sa.Enum('faq', 'policy', 'room_info', 'amenities', 'restaurant', 'general', name='document_type'), nullable=False),
    sa.Column('file_url', sa.Text(), nullable=True),
    sa.Column('status', sa.Enum('processing', 'ready', 'failed', name='document_status'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name=op.f('fk_knowledge_documents_organization_id_organizations'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], name=op.f('fk_knowledge_documents_property_id_properties'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_knowledge_documents'))
    )
    op.create_index(op.f('ix_knowledge_documents_organization_id'), 'knowledge_documents', ['organization_id'], unique=False)
    op.create_index(op.f('ix_knowledge_documents_property_id'), 'knowledge_documents', ['property_id'], unique=False)
    op.create_index(op.f('ix_knowledge_documents_status'), 'knowledge_documents', ['status'], unique=False)
    op.create_table('document_chunks',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('organization_id', sa.UUID(), nullable=False),
    sa.Column('document_id', sa.UUID(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('embedding', Vector(dim=1536), nullable=False),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['document_id'], ['knowledge_documents.id'], name=op.f('fk_document_chunks_document_id_knowledge_documents'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name=op.f('fk_document_chunks_organization_id_organizations'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_document_chunks'))
    )
    op.create_index(op.f('ix_document_chunks_document_id'), 'document_chunks', ['document_id'], unique=False)
    op.create_index(op.f('ix_document_chunks_organization_id'), 'document_chunks', ['organization_id'], unique=False)
    # Cosine-distance ANN index for RAG retrieval.
    op.execute(
        "CREATE INDEX ix_document_chunks_embedding_hnsw "
        "ON document_chunks USING hnsw (embedding vector_cosine_ops)"
    )
    op.create_table('messages',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('organization_id', sa.UUID(), nullable=False),
    sa.Column('conversation_id', sa.UUID(), nullable=False),
    sa.Column('role', sa.Enum('user', 'assistant', 'system', name='message_role'), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], name=op.f('fk_messages_conversation_id_conversations'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name=op.f('fk_messages_organization_id_organizations'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_messages'))
    )
    op.create_index(op.f('ix_messages_conversation_id'), 'messages', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_messages_organization_id'), 'messages', ['organization_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_messages_organization_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_conversation_id'), table_name='messages')
    op.drop_table('messages')
    op.execute('DROP INDEX IF EXISTS ix_document_chunks_embedding_hnsw')
    op.drop_index(op.f('ix_document_chunks_organization_id'), table_name='document_chunks')
    op.drop_index(op.f('ix_document_chunks_document_id'), table_name='document_chunks')
    op.drop_table('document_chunks')
    op.drop_index(op.f('ix_knowledge_documents_status'), table_name='knowledge_documents')
    op.drop_index(op.f('ix_knowledge_documents_property_id'), table_name='knowledge_documents')
    op.drop_index(op.f('ix_knowledge_documents_organization_id'), table_name='knowledge_documents')
    op.drop_table('knowledge_documents')
    op.drop_index(op.f('ix_conversations_property_id'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_organization_id'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_guest_id'), table_name='conversations')
    op.drop_table('conversations')
    sa.Enum(name='message_role').drop(op.get_bind())
    sa.Enum(name='document_status').drop(op.get_bind())
    sa.Enum(name='document_type').drop(op.get_bind())
    sa.Enum(name='conversation_channel').drop(op.get_bind())
