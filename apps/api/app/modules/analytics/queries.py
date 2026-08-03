"""SQLAlchemy query builders for analytics aggregates.

All queries must be filtered by organization_id (tenant isolation).
"""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Select, and_, case, func, select
from sqlalchemy.sql import ColumnElement

from app.modules.bookings.models import (
    ACTIVE_BOOKING_STATUSES,
    Booking,
    BookingItem,
    BookingStatus,
)
from app.modules.properties.models import Property, Unit, UnitStatus

# Booked revenue excludes cancelled stays.
_REVENUE_STATUSES = (
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.CHECKED_IN,
    BookingStatus.CHECKED_OUT,
)


def _org_booking_filter(org_id: uuid.UUID) -> ColumnElement[bool]:
    return Booking.organization_id == org_id


def count_properties(org_id: uuid.UUID) -> Select[tuple[int]]:
    return select(func.count()).select_from(Property).where(
        Property.organization_id == org_id
    )


def count_units(
    org_id: uuid.UUID, property_id: uuid.UUID | None = None
) -> Select[tuple[int]]:
    query = select(func.count()).select_from(Unit).where(Unit.organization_id == org_id)
    if property_id is not None:
        query = query.where(Unit.property_id == property_id)
    return query


def count_units_by_status(
    org_id: uuid.UUID,
    status: UnitStatus,
    property_id: uuid.UUID | None = None,
) -> Select[tuple[int]]:
    query = (
        select(func.count())
        .select_from(Unit)
        .where(Unit.organization_id == org_id, Unit.status == status)
    )
    if property_id is not None:
        query = query.where(Unit.property_id == property_id)
    return query


def count_active_bookings(
    org_id: uuid.UUID, property_id: uuid.UUID | None = None
) -> Select[tuple[int]]:
    query = (
        select(func.count())
        .select_from(Booking)
        .where(
            _org_booking_filter(org_id),
            Booking.status.in_(ACTIVE_BOOKING_STATUSES),
        )
    )
    if property_id is not None:
        query = query.where(Booking.property_id == property_id)
    return query


def sum_booking_revenue(
    org_id: uuid.UUID,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
    property_id: uuid.UUID | None = None,
) -> Select[tuple[object]]:
    """Sum Booking.total_amount for non-cancelled bookings (by check-in date)."""
    query = select(func.coalesce(func.sum(Booking.total_amount), 0)).where(
        _org_booking_filter(org_id),
        Booking.status.in_(_REVENUE_STATUSES),
    )
    if start_date is not None:
        query = query.where(Booking.check_in_date >= start_date)
    if end_date is not None:
        query = query.where(Booking.check_in_date <= end_date)
    if property_id is not None:
        query = query.where(Booking.property_id == property_id)
    return query


def daily_revenue(
    org_id: uuid.UUID,
    start_date: date,
    end_date: date,
    property_id: uuid.UUID | None = None,
) -> Select[tuple[date, object]]:
    query = (
        select(
            Booking.check_in_date.label("period_start"),
            func.coalesce(func.sum(Booking.total_amount), 0).label("revenue"),
        )
        .where(
            _org_booking_filter(org_id),
            Booking.status.in_(_REVENUE_STATUSES),
            Booking.check_in_date >= start_date,
            Booking.check_in_date <= end_date,
        )
        .group_by(Booking.check_in_date)
        .order_by(Booking.check_in_date)
    )
    if property_id is not None:
        query = query.where(Booking.property_id == property_id)
    return query


def monthly_revenue(
    org_id: uuid.UUID,
    start_date: date,
    end_date: date,
    property_id: uuid.UUID | None = None,
) -> Select[tuple[object, object]]:
    month_start = func.date_trunc("month", Booking.check_in_date)
    query = (
        select(
            month_start.label("period_start"),
            func.coalesce(func.sum(Booking.total_amount), 0).label("revenue"),
        )
        .where(
            _org_booking_filter(org_id),
            Booking.status.in_(_REVENUE_STATUSES),
            Booking.check_in_date >= start_date,
            Booking.check_in_date <= end_date,
        )
        .group_by(month_start)
        .order_by(month_start)
    )
    if property_id is not None:
        query = query.where(Booking.property_id == property_id)
    return query


def revenue_by_property(
    org_id: uuid.UUID,
    start_date: date,
    end_date: date,
    property_id: uuid.UUID | None = None,
) -> Select[tuple[uuid.UUID, str, object]]:
    query = (
        select(
            Property.id.label("property_id"),
            Property.name.label("property_name"),
            func.coalesce(func.sum(Booking.total_amount), 0).label("revenue"),
        )
        .select_from(Property)
        .outerjoin(
            Booking,
            and_(
                Booking.property_id == Property.id,
                Booking.organization_id == org_id,
                Booking.status.in_(_REVENUE_STATUSES),
                Booking.check_in_date >= start_date,
                Booking.check_in_date <= end_date,
            ),
        )
        .where(Property.organization_id == org_id)
        .group_by(Property.id, Property.name)
        .order_by(Property.name)
    )
    if property_id is not None:
        query = query.where(Property.id == property_id)
    return query


def occupied_unit_ids(
    org_id: uuid.UUID,
    as_of: date,
    property_id: uuid.UUID | None = None,
) -> Select[tuple[uuid.UUID]]:
    """Distinct units held by active bookings on as_of (check_in <= as_of < check_out)."""
    query = (
        select(BookingItem.unit_id)
        .join(Booking, BookingItem.booking_id == Booking.id)
        .where(
            Booking.organization_id == org_id,
            BookingItem.organization_id == org_id,
            Booking.status.in_(ACTIVE_BOOKING_STATUSES),
            Booking.check_in_date <= as_of,
            Booking.check_out_date > as_of,
        )
        .distinct()
    )
    if property_id is not None:
        query = query.where(Booking.property_id == property_id)
    return query


def booking_status_counts(
    org_id: uuid.UUID, property_id: uuid.UUID | None = None
) -> Select[tuple[BookingStatus, int]]:
    query = (
        select(Booking.status, func.count().label("count"))
        .where(_org_booking_filter(org_id))
        .group_by(Booking.status)
    )
    if property_id is not None:
        query = query.where(Booking.property_id == property_id)
    return query


def property_booking_stats(
    org_id: uuid.UUID,
) -> Select[tuple[uuid.UUID, str, int, object]]:
    """Per-property booking count and revenue (non-cancelled)."""
    return (
        select(
            Property.id.label("property_id"),
            Property.name.label("property_name"),
            func.count(Booking.id).label("bookings_count"),
            func.coalesce(
                func.sum(
                    case(
                        (Booking.status.in_(_REVENUE_STATUSES), Booking.total_amount),
                        else_=0,
                    )
                ),
                0,
            ).label("revenue"),
        )
        .select_from(Property)
        .outerjoin(
            Booking,
            and_(
                Booking.property_id == Property.id,
                Booking.organization_id == org_id,
            ),
        )
        .where(Property.organization_id == org_id)
        .group_by(Property.id, Property.name)
        .order_by(Property.name)
    )
