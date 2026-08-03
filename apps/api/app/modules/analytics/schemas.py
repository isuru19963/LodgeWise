"""Analytics response schemas.

Revenue uses Booking.total_amount (denormalized from booking_items).
A dedicated guest payments ledger is not implemented yet; payment_status on
bookings can refine "collected" vs "booked" revenue later.
"""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class OverviewResponse(BaseModel):
    total_properties: int
    total_units: int
    active_bookings: int
    occupancy_rate: float = Field(description="Occupied / (available + occupied) * 100")
    total_revenue: Decimal


class RevenuePoint(BaseModel):
    label: str
    period_start: date
    revenue: Decimal


class PropertyRevenue(BaseModel):
    property_id: uuid.UUID
    property_name: str
    revenue: Decimal


class RevenueResponse(BaseModel):
    start_date: date
    end_date: date
    property_id: uuid.UUID | None = None
    daily_revenue: list[RevenuePoint]
    monthly_revenue: list[RevenuePoint]
    revenue_by_property: list[PropertyRevenue]
    total_revenue: Decimal


class OccupancyResponse(BaseModel):
    occupancy_rate: float
    available_units: int
    occupied_units: int
    maintenance_units: int
    as_of_date: date
    property_id: uuid.UUID | None = None


class BookingsAnalyticsResponse(BaseModel):
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    completed_stays: int


class PropertyPerformanceRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    property_id: uuid.UUID
    property_name: str
    bookings_count: int
    revenue: Decimal
    occupancy_rate: float


class PropertiesAnalyticsResponse(BaseModel):
    properties: list[PropertyPerformanceRow]
    as_of_date: date
