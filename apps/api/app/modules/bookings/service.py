import secrets
import string
import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.auth.dependencies import TenantContext
from app.modules.bookings import repository
from app.modules.bookings.models import (
    ACTIVE_BOOKING_STATUSES,
    Booking,
    BookingItem,
    BookingStatus,
)
from app.modules.bookings.schemas import BookingCreate, BookingItemCreate, BookingUpdate
from app.modules.guests import repository as guests_repository
from app.modules.properties import repository as properties_repository

_REFERENCE_ALPHABET = string.ascii_uppercase + string.digits


async def _generate_reference(session: AsyncSession) -> str:
    for _ in range(5):
        reference = "LW-" + "".join(secrets.choice(_REFERENCE_ALPHABET) for _ in range(6))
        if not await repository.reference_exists(session, reference):
            return reference
    raise ConflictError("Could not generate a unique booking reference")


def _total(items: list[BookingItemCreate]) -> Decimal:
    return sum((item.price * item.quantity for item in items), Decimal("0"))


async def _validate_units(
    session: AsyncSession,
    tenant: TenantContext,
    property_id: uuid.UUID,
    items: list[BookingItemCreate],
) -> None:
    """Every unit must exist, belong to the tenant, and belong to the property."""
    units = await properties_repository.list_units(
        session, tenant.organization_id, property_id=property_id
    )
    property_unit_ids = {unit.id for unit in units}
    unknown = [str(i.unit_id) for i in items if i.unit_id not in property_unit_ids]
    if unknown:
        raise NotFoundError(f"Units not found in this property: {', '.join(unknown)}")


async def _ensure_available(
    session: AsyncSession,
    tenant: TenantContext,
    booking: Booking | None,
    unit_ids: list[uuid.UUID],
    check_in: object,
    check_out: object,
) -> None:
    conflicts = await repository.find_conflicting_unit_ids(
        session,
        tenant.organization_id,
        unit_ids,
        check_in,  # type: ignore[arg-type]
        check_out,  # type: ignore[arg-type]
        exclude_booking_id=booking.id if booking else None,
    )
    if conflicts:
        raise ConflictError(
            "Units not available for the selected dates: "
            + ", ".join(str(u) for u in sorted(conflicts))
        )


async def list_bookings(
    session: AsyncSession,
    tenant: TenantContext,
    property_id: uuid.UUID | None,
    guest_id: uuid.UUID | None,
    booking_status: BookingStatus | None,
) -> list[Booking]:
    return await repository.list_bookings(
        session, tenant.organization_id, property_id, guest_id, booking_status
    )


async def get_booking(
    session: AsyncSession, tenant: TenantContext, booking_id: uuid.UUID
) -> Booking:
    booking = await repository.get_booking(session, tenant.organization_id, booking_id)
    if booking is None:
        raise NotFoundError("Booking not found")
    return booking


async def create_booking(
    session: AsyncSession, tenant: TenantContext, data: BookingCreate
) -> Booking:
    if await properties_repository.get_property(
        session, tenant.organization_id, data.property_id
    ) is None:
        raise NotFoundError("Property not found")
    if await guests_repository.get_guest(session, tenant.organization_id, data.guest_id) is None:
        raise NotFoundError("Guest not found")

    await _validate_units(session, tenant, data.property_id, data.items)
    await _ensure_available(
        session,
        tenant,
        None,
        [i.unit_id for i in data.items],
        data.check_in_date,
        data.check_out_date,
    )

    booking = Booking(
        organization_id=tenant.organization_id,
        property_id=data.property_id,
        guest_id=data.guest_id,
        booking_reference=await _generate_reference(session),
        check_in_date=data.check_in_date,
        check_out_date=data.check_out_date,
        adults=data.adults,
        children=data.children,
        status=data.status,
        total_amount=_total(data.items),
        items=[
            BookingItem(
                organization_id=tenant.organization_id,
                unit_id=item.unit_id,
                price=item.price,
                quantity=item.quantity,
            )
            for item in data.items
        ],
    )
    session.add(booking)
    await session.commit()
    return await get_booking(session, tenant, booking.id)


async def update_booking(
    session: AsyncSession, tenant: TenantContext, booking_id: uuid.UUID, data: BookingUpdate
) -> Booking:
    booking = await get_booking(session, tenant, booking_id)
    changes = data.model_dump(exclude_unset=True)

    # Resolve the final state after this update to validate it as a whole.
    final_check_in = changes.get("check_in_date", booking.check_in_date)
    final_check_out = changes.get("check_out_date", booking.check_out_date)
    if final_check_out <= final_check_in:
        raise ConflictError("check_out_date must be after check_in_date")

    final_status = changes.get("status", booking.status)

    if data.items is not None:
        await _validate_units(session, tenant, booking.property_id, data.items)
        final_unit_ids = [i.unit_id for i in data.items]
    else:
        final_unit_ids = [i.unit_id for i in booking.items]

    # Availability is enforced whenever the booking (still) holds inventory.
    if final_status in ACTIVE_BOOKING_STATUSES:
        await _ensure_available(
            session, tenant, booking, final_unit_ids, final_check_in, final_check_out
        )

    for field in ("check_in_date", "check_out_date", "adults", "children", "status",
                  "payment_status"):
        if field in changes:
            setattr(booking, field, changes[field])

    if data.items is not None:
        booking.items = [
            BookingItem(
                organization_id=tenant.organization_id,
                unit_id=item.unit_id,
                price=item.price,
                quantity=item.quantity,
            )
            for item in data.items
        ]
        booking.total_amount = _total(data.items)

    await session.commit()
    return await get_booking(session, tenant, booking.id)
