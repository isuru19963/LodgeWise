import uuid

from fastapi import APIRouter, Query, status

from app.modules.auth.dependencies import CurrentTenant, TenantDB
from app.modules.guests import service
from app.modules.guests.schemas import GuestCreate, GuestResponse, GuestUpdate

router = APIRouter(prefix="/guests", tags=["guests"])


@router.post("", response_model=GuestResponse, status_code=status.HTTP_201_CREATED)
async def create_guest(
    data: GuestCreate, tenant: CurrentTenant, session: TenantDB
) -> GuestResponse:
    guest = await service.create_guest(session, tenant, data)
    return GuestResponse.model_validate(guest)


@router.get("", response_model=list[GuestResponse])
async def list_guests(
    tenant: CurrentTenant,
    session: TenantDB,
    search: str | None = Query(default=None, max_length=100),
) -> list[GuestResponse]:
    guests = await service.list_guests(session, tenant, search)
    return [GuestResponse.model_validate(g) for g in guests]


@router.get("/{guest_id}", response_model=GuestResponse)
async def get_guest(
    guest_id: uuid.UUID, tenant: CurrentTenant, session: TenantDB
) -> GuestResponse:
    guest = await service.get_guest(session, tenant, guest_id)
    return GuestResponse.model_validate(guest)


@router.put("/{guest_id}", response_model=GuestResponse)
async def update_guest(
    guest_id: uuid.UUID, data: GuestUpdate, tenant: CurrentTenant, session: TenantDB
) -> GuestResponse:
    guest = await service.update_guest(session, tenant, guest_id, data)
    return GuestResponse.model_validate(guest)
