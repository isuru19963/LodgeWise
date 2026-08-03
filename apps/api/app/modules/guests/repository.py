import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.guests.models import Guest


async def list_guests(
    session: AsyncSession, org_id: uuid.UUID, search: str | None = None
) -> list[Guest]:
    query = select(Guest).where(Guest.organization_id == org_id)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            Guest.first_name.ilike(pattern)
            | Guest.last_name.ilike(pattern)
            | Guest.email.ilike(pattern)
        )
    result = await session.scalars(query.order_by(Guest.created_at))
    return list(result)


async def get_guest(
    session: AsyncSession, org_id: uuid.UUID, guest_id: uuid.UUID
) -> Guest | None:
    return await session.scalar(
        select(Guest).where(Guest.id == guest_id, Guest.organization_id == org_id)
    )


async def email_exists(
    session: AsyncSession,
    org_id: uuid.UUID,
    email: str,
    exclude_guest_id: uuid.UUID | None = None,
) -> bool:
    query = select(Guest.id).where(Guest.organization_id == org_id, Guest.email == email)
    if exclude_guest_id is not None:
        query = query.where(Guest.id != exclude_guest_id)
    return await session.scalar(query) is not None
