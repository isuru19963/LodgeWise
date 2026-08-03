import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.bookings.models import (
    ACTIVE_BOOKING_STATUSES,
    Booking,
    BookingItem,
    BookingStatus,
)


async def list_bookings(
    session: AsyncSession,
    org_id: uuid.UUID,
    property_id: uuid.UUID | None = None,
    guest_id: uuid.UUID | None = None,
    booking_status: BookingStatus | None = None,
) -> list[Booking]:
    query = (
        select(Booking)
        .where(Booking.organization_id == org_id)
        .options(selectinload(Booking.items))
    )
    if property_id is not None:
        query = query.where(Booking.property_id == property_id)
    if guest_id is not None:
        query = query.where(Booking.guest_id == guest_id)
    if booking_status is not None:
        query = query.where(Booking.status == booking_status)
    result = await session.scalars(query.order_by(Booking.check_in_date.desc()))
    return list(result)


async def get_booking(
    session: AsyncSession, org_id: uuid.UUID, booking_id: uuid.UUID
) -> Booking | None:
    return await session.scalar(
        select(Booking)
        .where(Booking.id == booking_id, Booking.organization_id == org_id)
        .options(selectinload(Booking.items))
    )


async def reference_exists(session: AsyncSession, reference: str) -> bool:
    return (
        await session.scalar(select(Booking.id).where(Booking.booking_reference == reference))
    ) is not None


async def find_conflicting_unit_ids(
    session: AsyncSession,
    org_id: uuid.UUID,
    unit_ids: list[uuid.UUID],
    check_in: date,
    check_out: date,
    exclude_booking_id: uuid.UUID | None = None,
) -> set[uuid.UUID]:
    """Return the subset of unit_ids already held by an active booking that
    overlaps [check_in, check_out). Cancelled and checked-out bookings do not
    block inventory."""
    query = (
        select(BookingItem.unit_id)
        .join(Booking, BookingItem.booking_id == Booking.id)
        .where(
            BookingItem.unit_id.in_(unit_ids),
            Booking.organization_id == org_id,
            Booking.status.in_(ACTIVE_BOOKING_STATUSES),
            Booking.check_in_date < check_out,
            Booking.check_out_date > check_in,
        )
    )
    if exclude_booking_id is not None:
        query = query.where(Booking.id != exclude_booking_id)
    result = await session.scalars(query)
    return set(result)
