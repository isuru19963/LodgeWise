"""Analytics repository — execute tenant-scoped aggregate queries."""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.analytics import queries
from app.modules.bookings.models import BookingStatus
from app.modules.properties.models import Unit, UnitStatus


async def get_overview_counts(
    session: AsyncSession, org_id: uuid.UUID
) -> dict[str, int | Decimal]:
    total_properties = await session.scalar(queries.count_properties(org_id)) or 0
    total_units = await session.scalar(queries.count_units(org_id)) or 0
    active_bookings = await session.scalar(queries.count_active_bookings(org_id)) or 0
    total_revenue = await session.scalar(queries.sum_booking_revenue(org_id)) or Decimal(
        "0"
    )
    return {
        "total_properties": int(total_properties),
        "total_units": int(total_units),
        "active_bookings": int(active_bookings),
        "total_revenue": Decimal(total_revenue),
    }


async def get_revenue_series(
    session: AsyncSession,
    org_id: uuid.UUID,
    start_date: date,
    end_date: date,
    property_id: uuid.UUID | None = None,
) -> dict[str, list | Decimal]:
    daily_rows = (
        await session.execute(
            queries.daily_revenue(org_id, start_date, end_date, property_id)
        )
    ).all()
    monthly_rows = (
        await session.execute(
            queries.monthly_revenue(org_id, start_date, end_date, property_id)
        )
    ).all()
    property_rows = (
        await session.execute(
            queries.revenue_by_property(org_id, start_date, end_date, property_id)
        )
    ).all()
    total = await session.scalar(
        queries.sum_booking_revenue(
            org_id,
            start_date=start_date,
            end_date=end_date,
            property_id=property_id,
        )
    ) or Decimal("0")

    return {
        "daily": daily_rows,
        "monthly": monthly_rows,
        "by_property": property_rows,
        "total_revenue": Decimal(total),
    }


async def get_occupancy_snapshot(
    session: AsyncSession,
    org_id: uuid.UUID,
    as_of: date,
    property_id: uuid.UUID | None = None,
) -> dict[str, int]:
    occupied_ids = set(
        (
            await session.scalars(
                queries.occupied_unit_ids(org_id, as_of, property_id)
            )
        ).all()
    )
    occupied_units = len(occupied_ids)

    maintenance_units = int(
        await session.scalar(
            queries.count_units_by_status(
                org_id, UnitStatus.MAINTENANCE, property_id
            )
        )
        or 0
    )

    available_query = select(Unit.id).where(
        Unit.organization_id == org_id,
        Unit.status == UnitStatus.AVAILABLE,
    )
    if property_id is not None:
        available_query = available_query.where(Unit.property_id == property_id)

    available_ids = set((await session.scalars(available_query)).all())
    available_units = len(available_ids - occupied_ids)

    return {
        "available_units": available_units,
        "occupied_units": occupied_units,
        "maintenance_units": maintenance_units,
    }


async def get_booking_counts(
    session: AsyncSession,
    org_id: uuid.UUID,
    property_id: uuid.UUID | None = None,
) -> dict[str, int]:
    rows = (
        await session.execute(queries.booking_status_counts(org_id, property_id))
    ).all()
    by_status = {status: int(count) for status, count in rows}

    total = sum(by_status.values())
    return {
        "total_bookings": total,
        "confirmed_bookings": by_status.get(BookingStatus.CONFIRMED, 0),
        "cancelled_bookings": by_status.get(BookingStatus.CANCELLED, 0),
        "completed_stays": by_status.get(BookingStatus.CHECKED_OUT, 0),
    }


async def get_property_performance(
    session: AsyncSession,
    org_id: uuid.UUID,
    as_of: date,
) -> list[dict]:
    rows = (await session.execute(queries.property_booking_stats(org_id))).all()
    results: list[dict] = []

    for property_id, property_name, bookings_count, revenue in rows:
        snap = await get_occupancy_snapshot(session, org_id, as_of, property_id)
        denom = snap["available_units"] + snap["occupied_units"]
        occupancy_rate = (
            round((snap["occupied_units"] / denom) * 100, 2) if denom > 0 else 0.0
        )
        results.append(
            {
                "property_id": property_id,
                "property_name": property_name,
                "bookings_count": int(bookings_count or 0),
                "revenue": Decimal(revenue or 0),
                "occupancy_rate": occupancy_rate,
            }
        )

    return results
