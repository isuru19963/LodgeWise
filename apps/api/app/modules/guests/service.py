import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.auth.dependencies import TenantContext
from app.modules.guests import repository
from app.modules.guests.models import Guest
from app.modules.guests.schemas import GuestCreate, GuestUpdate


async def list_guests(
    session: AsyncSession, tenant: TenantContext, search: str | None
) -> list[Guest]:
    return await repository.list_guests(session, tenant.organization_id, search)


async def get_guest(session: AsyncSession, tenant: TenantContext, guest_id: uuid.UUID) -> Guest:
    guest = await repository.get_guest(session, tenant.organization_id, guest_id)
    if guest is None:
        raise NotFoundError("Guest not found")
    return guest


async def create_guest(session: AsyncSession, tenant: TenantContext, data: GuestCreate) -> Guest:
    email = data.email.lower() if data.email else None
    if email and await repository.email_exists(session, tenant.organization_id, email):
        raise ConflictError("A guest with this email already exists")

    guest = Guest(
        organization_id=tenant.organization_id,
        **{**data.model_dump(), "email": email},
    )
    session.add(guest)
    await session.commit()
    await session.refresh(guest)
    return guest


async def update_guest(
    session: AsyncSession, tenant: TenantContext, guest_id: uuid.UUID, data: GuestUpdate
) -> Guest:
    guest = await get_guest(session, tenant, guest_id)

    changes = data.model_dump(exclude_unset=True)
    if "email" in changes and changes["email"]:
        changes["email"] = changes["email"].lower()
        if await repository.email_exists(
            session, tenant.organization_id, changes["email"], exclude_guest_id=guest.id
        ):
            raise ConflictError("A guest with this email already exists")

    for field, value in changes.items():
        setattr(guest, field, value)

    await session.commit()
    await session.refresh(guest)
    return guest
