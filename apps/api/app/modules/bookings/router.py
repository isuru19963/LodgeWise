import uuid

from fastapi import APIRouter, Query, status

from app.modules.auth.dependencies import CurrentTenant, TenantDB
from app.modules.bookings import service
from app.modules.bookings.models import BookingStatus
from app.modules.bookings.schemas import BookingCreate, BookingResponse, BookingUpdate

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: BookingCreate, tenant: CurrentTenant, session: TenantDB
) -> BookingResponse:
    booking = await service.create_booking(session, tenant, data)
    return BookingResponse.model_validate(booking)


@router.get("", response_model=list[BookingResponse])
async def list_bookings(
    tenant: CurrentTenant,
    session: TenantDB,
    property_id: uuid.UUID | None = Query(default=None),
    guest_id: uuid.UUID | None = Query(default=None),
    booking_status: BookingStatus | None = Query(default=None, alias="status"),
) -> list[BookingResponse]:
    bookings = await service.list_bookings(session, tenant, property_id, guest_id, booking_status)
    return [BookingResponse.model_validate(b) for b in bookings]


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: uuid.UUID, tenant: CurrentTenant, session: TenantDB
) -> BookingResponse:
    booking = await service.get_booking(session, tenant, booking_id)
    return BookingResponse.model_validate(booking)


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: uuid.UUID, data: BookingUpdate, tenant: CurrentTenant, session: TenantDB
) -> BookingResponse:
    booking = await service.update_booking(session, tenant, booking_id, data)
    return BookingResponse.model_validate(booking)
