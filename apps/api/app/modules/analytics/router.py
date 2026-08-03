"""Analytics HTTP routes — tenant-scoped read aggregates."""

from __future__ import annotations

import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Query

from app.modules.analytics import service
from app.modules.analytics.schemas import (
    BookingsAnalyticsResponse,
    OccupancyResponse,
    OverviewResponse,
    PropertiesAnalyticsResponse,
    RevenueResponse,
)
from app.modules.auth.dependencies import CurrentTenant, TenantDB

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _default_range() -> tuple[date, date]:
    end = date.today()
    start = end - timedelta(days=89)
    return start, end


@router.get("/overview", response_model=OverviewResponse)
async def analytics_overview(
    tenant: CurrentTenant, session: TenantDB
) -> OverviewResponse:
    return await service.get_overview(session, tenant)


@router.get("/revenue", response_model=RevenueResponse)
async def analytics_revenue(
    tenant: CurrentTenant,
    session: TenantDB,
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    property_id: uuid.UUID | None = Query(default=None),
) -> RevenueResponse:
    default_start, default_end = _default_range()
    return await service.get_revenue(
        session,
        tenant,
        start_date or default_start,
        end_date or default_end,
        property_id,
    )


@router.get("/occupancy", response_model=OccupancyResponse)
async def analytics_occupancy(
    tenant: CurrentTenant,
    session: TenantDB,
    property_id: uuid.UUID | None = Query(default=None),
    as_of: date | None = Query(
        default=None, description="Occupancy snapshot date (defaults to today)"
    ),
) -> OccupancyResponse:
    return await service.get_occupancy(session, tenant, property_id, as_of)


@router.get("/bookings", response_model=BookingsAnalyticsResponse)
async def analytics_bookings(
    tenant: CurrentTenant,
    session: TenantDB,
    property_id: uuid.UUID | None = Query(default=None),
) -> BookingsAnalyticsResponse:
    return await service.get_bookings_analytics(session, tenant, property_id)


@router.get("/properties", response_model=PropertiesAnalyticsResponse)
async def analytics_properties(
    tenant: CurrentTenant, session: TenantDB
) -> PropertiesAnalyticsResponse:
    return await service.get_properties_analytics(session, tenant)
