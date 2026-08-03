"""Analytics service — assemble repository results into response schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DomainError, NotFoundError
from app.modules.analytics import repository
from app.modules.analytics.schemas import (
    BookingsAnalyticsResponse,
    OccupancyResponse,
    OverviewResponse,
    PropertiesAnalyticsResponse,
    PropertyPerformanceRow,
    PropertyRevenue,
    RevenuePoint,
    RevenueResponse,
)
from app.modules.auth.dependencies import TenantContext
from app.modules.properties import repository as properties_repository


def _occupancy_rate(available: int, occupied: int) -> float:
    denom = available + occupied
    if denom <= 0:
        return 0.0
    return round((occupied / denom) * 100, 2)


def _as_date(value: object) -> date:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value)[:10])


async def get_overview(
    session: AsyncSession, tenant: TenantContext
) -> OverviewResponse:
    counts = await repository.get_overview_counts(session, tenant.organization_id)
    today = date.today()
    snap = await repository.get_occupancy_snapshot(
        session, tenant.organization_id, today
    )
    return OverviewResponse(
        total_properties=int(counts["total_properties"]),
        total_units=int(counts["total_units"]),
        active_bookings=int(counts["active_bookings"]),
        occupancy_rate=_occupancy_rate(
            snap["available_units"], snap["occupied_units"]
        ),
        total_revenue=Decimal(str(counts["total_revenue"])),
    )


async def get_revenue(
    session: AsyncSession,
    tenant: TenantContext,
    start_date: date,
    end_date: date,
    property_id: uuid.UUID | None = None,
) -> RevenueResponse:
    if end_date < start_date:
        raise DomainError("end_date must be on or after start_date")

    if property_id is not None:
        prop = await properties_repository.get_property(
            session, tenant.organization_id, property_id
        )
        if prop is None:
            raise NotFoundError("Property not found")

    data = await repository.get_revenue_series(
        session, tenant.organization_id, start_date, end_date, property_id
    )

    daily = [
        RevenuePoint(
            label=_as_date(row.period_start).isoformat(),
            period_start=_as_date(row.period_start),
            revenue=Decimal(row.revenue),
        )
        for row in data["daily"]
    ]
    monthly = [
        RevenuePoint(
            label=_as_date(row.period_start).strftime("%Y-%m"),
            period_start=_as_date(row.period_start),
            revenue=Decimal(row.revenue),
        )
        for row in data["monthly"]
    ]
    by_property = [
        PropertyRevenue(
            property_id=row.property_id,
            property_name=row.property_name,
            revenue=Decimal(row.revenue),
        )
        for row in data["by_property"]
    ]

    return RevenueResponse(
        start_date=start_date,
        end_date=end_date,
        property_id=property_id,
        daily_revenue=daily,
        monthly_revenue=monthly,
        revenue_by_property=by_property,
        total_revenue=Decimal(str(data["total_revenue"])),
    )


async def get_occupancy(
    session: AsyncSession,
    tenant: TenantContext,
    property_id: uuid.UUID | None = None,
    as_of: date | None = None,
) -> OccupancyResponse:
    if property_id is not None:
        prop = await properties_repository.get_property(
            session, tenant.organization_id, property_id
        )
        if prop is None:
            raise NotFoundError("Property not found")

    day = as_of or date.today()
    snap = await repository.get_occupancy_snapshot(
        session, tenant.organization_id, day, property_id
    )
    return OccupancyResponse(
        occupancy_rate=_occupancy_rate(
            snap["available_units"], snap["occupied_units"]
        ),
        available_units=snap["available_units"],
        occupied_units=snap["occupied_units"],
        maintenance_units=snap["maintenance_units"],
        as_of_date=day,
        property_id=property_id,
    )


async def get_bookings_analytics(
    session: AsyncSession,
    tenant: TenantContext,
    property_id: uuid.UUID | None = None,
) -> BookingsAnalyticsResponse:
    if property_id is not None:
        prop = await properties_repository.get_property(
            session, tenant.organization_id, property_id
        )
        if prop is None:
            raise NotFoundError("Property not found")

    counts = await repository.get_booking_counts(
        session, tenant.organization_id, property_id
    )
    return BookingsAnalyticsResponse(**counts)


async def get_properties_analytics(
    session: AsyncSession, tenant: TenantContext
) -> PropertiesAnalyticsResponse:
    today = date.today()
    rows = await repository.get_property_performance(
        session, tenant.organization_id, today
    )
    return PropertiesAnalyticsResponse(
        properties=[PropertyPerformanceRow(**row) for row in rows],
        as_of_date=today,
    )
