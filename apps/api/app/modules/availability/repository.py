import uuid
from datetime import date

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.availability.models import (
    AvailabilityStatus,
    PricingRule,
    UnitAvailability,
)


async def list_availability_overrides(
    session: AsyncSession,
    org_id: uuid.UUID,
    property_id: uuid.UUID,
    start_date: date,
    end_date: date,
    unit_ids: list[uuid.UUID] | None = None,
) -> list[UnitAvailability]:
    query = select(UnitAvailability).where(
        UnitAvailability.organization_id == org_id,
        UnitAvailability.property_id == property_id,
        UnitAvailability.date >= start_date,
        UnitAvailability.date <= end_date,
    )
    if unit_ids is not None:
        query = query.where(UnitAvailability.unit_id.in_(unit_ids))
    result = await session.scalars(query)
    return list(result)


async def find_unavailable_unit_ids(
    session: AsyncSession,
    org_id: uuid.UUID,
    unit_ids: list[uuid.UUID],
    start_date: date,
    end_date: date,
) -> set[uuid.UUID]:
    """Units with BLOCKED or MAINTENANCE on any day in [start_date, end_date]."""
    if not unit_ids:
        return set()
    result = await session.scalars(
        select(UnitAvailability.unit_id)
        .where(
            UnitAvailability.organization_id == org_id,
            UnitAvailability.unit_id.in_(unit_ids),
            UnitAvailability.date >= start_date,
            UnitAvailability.date <= end_date,
            UnitAvailability.status.in_(
                (AvailabilityStatus.BLOCKED, AvailabilityStatus.MAINTENANCE)
            ),
        )
        .distinct()
    )
    return set(result)


async def set_available_days(
    session: AsyncSession,
    org_id: uuid.UUID,
    unit_id: uuid.UUID,
    dates: list[date],
) -> int:
    """Remove availability overrides so the unit returns to default available."""
    if not dates:
        return 0
    result = await session.execute(
        UnitAvailability.__table__.delete().where(
            and_(
                UnitAvailability.organization_id == org_id,
                UnitAvailability.unit_id == unit_id,
                UnitAvailability.date.in_(dates),
            )
        )
    )
    return result.rowcount or 0


async def list_pricing_rules(
    session: AsyncSession,
    org_id: uuid.UUID,
    property_id: uuid.UUID | None = None,
    unit_type_id: uuid.UUID | None = None,
) -> list[PricingRule]:
    query = select(PricingRule).where(PricingRule.organization_id == org_id)
    if property_id is not None:
        query = query.where(PricingRule.property_id == property_id)
    if unit_type_id is not None:
        query = query.where(PricingRule.unit_type_id == unit_type_id)
    result = await session.scalars(query.order_by(PricingRule.start_date))
    return list(result)


async def get_pricing_rule(
    session: AsyncSession, org_id: uuid.UUID, rule_id: uuid.UUID
) -> PricingRule | None:
    return await session.scalar(
        select(PricingRule).where(
            PricingRule.id == rule_id, PricingRule.organization_id == org_id
        )
    )


async def list_applicable_rules(
    session: AsyncSession,
    org_id: uuid.UUID,
    property_id: uuid.UUID,
    unit_type_id: uuid.UUID,
    start_date: date,
    last_night: date,
) -> list[PricingRule]:
    """Rules whose window overlaps [start_date, last_night] inclusive."""
    result = await session.scalars(
        select(PricingRule).where(
            PricingRule.organization_id == org_id,
            PricingRule.property_id == property_id,
            PricingRule.unit_type_id == unit_type_id,
            PricingRule.start_date <= last_night,
            PricingRule.end_date >= start_date,
        )
    )
    return list(result)
