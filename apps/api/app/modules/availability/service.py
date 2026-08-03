import uuid
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.auth.dependencies import TenantContext
from app.modules.availability import repository
from app.modules.availability.models import (
    AvailabilityStatus,
    PricingRule,
    PricingRuleType,
    UnitAvailability,
)
from app.modules.availability.schemas import (
    AppliedRule,
    AvailabilityDayResponse,
    AvailabilityResponse,
    AvailableUnit,
    BlockRequest,
    BlockResponse,
    NightlyPrice,
    PricingRuleCreate,
    PricingRuleUpdate,
    UnblockRequest,
)
from app.modules.bookings import repository as bookings_repository
from app.modules.properties import repository as properties_repository
from app.modules.properties.models import Unit, UnitStatus, UnitType

_WEEKEND_DAYS = {4, 5, 6}  # Friday, Saturday, Sunday


def _daterange_inclusive(start: date, end: date) -> list[date]:
    days: list[date] = []
    current = start
    while current <= end:
        days.append(current)
        current += timedelta(days=1)
    return days


def _stay_nights(check_in: date, check_out: date) -> list[date]:
    """Nights in [check_in, check_out)."""
    return _daterange_inclusive(check_in, check_out - timedelta(days=1))


def _rule_applies(rule: PricingRule, night: date) -> bool:
    if night < rule.start_date or night > rule.end_date:
        return False
    if rule.rule_type is PricingRuleType.WEEKEND:
        return night.weekday() in _WEEKEND_DAYS
    return True


def _apply_rules(base: Decimal, rules: list[PricingRule], night: date) -> tuple[Decimal, list[AppliedRule]]:
    price = base
    applied: list[AppliedRule] = []
    for rule in rules:
        if not _rule_applies(rule, night):
            continue
        if rule.percentage is not None:
            price = price * (Decimal("1") + rule.percentage / Decimal("100"))
        if rule.amount is not None:
            price = price + rule.amount
        applied.append(
            AppliedRule(
                id=rule.id,
                name=rule.name,
                rule_type=rule.rule_type,
                amount=rule.amount,
                percentage=rule.percentage,
            )
        )
    return price.quantize(Decimal("0.01")), applied


async def _get_unit(
    session: AsyncSession, tenant: TenantContext, property_id: uuid.UUID, unit_id: uuid.UUID
) -> Unit:
    units = await properties_repository.list_units(
        session, tenant.organization_id, property_id=property_id
    )
    for unit in units:
        if unit.id == unit_id:
            return unit
    raise NotFoundError("Unit not found")


async def _get_unit_type(
    session: AsyncSession, tenant: TenantContext, unit_type_id: uuid.UUID
) -> UnitType:
    unit_type = await properties_repository.get_unit_type(
        session, tenant.organization_id, unit_type_id
    )
    if unit_type is None:
        raise NotFoundError("Unit type not found")
    return unit_type


# --- Availability -----------------------------------------------------------------


async def get_availability(
    session: AsyncSession,
    tenant: TenantContext,
    property_id: uuid.UUID,
    start_date: date,
    end_date: date,
    unit_type_id: uuid.UUID | None = None,
) -> AvailabilityResponse:
    if await properties_repository.get_property(
        session, tenant.organization_id, property_id
    ) is None:
        raise NotFoundError("Property not found")

    units = await properties_repository.list_units(
        session, tenant.organization_id, property_id=property_id, unit_type_id=unit_type_id
    )
    # Maintenance / out-of-service units cannot be booked.
    bookable = [
        u
        for u in units
        if u.status is UnitStatus.AVAILABLE
    ]
    unit_ids = [u.id for u in bookable]

    booked = await bookings_repository.find_conflicting_unit_ids(
        session, tenant.organization_id, unit_ids, start_date, end_date
    )
    # Stay nights: blocks on any night of the stay remove the unit.
    last_night = end_date - timedelta(days=1)
    blocked = await repository.find_unavailable_unit_ids(
        session, tenant.organization_id, unit_ids, start_date, last_night
    )
    available_units = [u for u in bookable if u.id not in booked and u.id not in blocked]

    # Load unit types for base prices (one query path via map).
    type_ids = {u.unit_type_id for u in available_units}
    type_map: dict[uuid.UUID, UnitType] = {}
    for tid in type_ids:
        unit_type = await properties_repository.get_unit_type(
            session, tenant.organization_id, tid
        )
        if unit_type is not None:
            type_map[tid] = unit_type

    nights = _stay_nights(start_date, end_date)
    results: list[AvailableUnit] = []
    for unit in available_units:
        unit_type = type_map.get(unit.unit_type_id)
        if unit_type is None:
            continue
        base = Decimal(str(unit_type.base_price))
        rules = await repository.list_applicable_rules(
            session,
            tenant.organization_id,
            property_id,
            unit.unit_type_id,
            start_date,
            last_night,
        )
        nightly: list[NightlyPrice] = []
        total = Decimal("0")
        for night in nights:
            final, applied = _apply_rules(base, rules, night)
            nightly.append(
                NightlyPrice(
                    date=night,
                    base_price=base,
                    final_price=final,
                    applied_rules=applied,
                )
            )
            total += final
        results.append(
            AvailableUnit(
                unit_id=unit.id,
                property_id=unit.property_id,
                unit_type_id=unit.unit_type_id,
                name=unit.name,
                code=unit.code,
                base_price=base,
                nights=nightly,
                total_price=total.quantize(Decimal("0.01")),
            )
        )

    return AvailabilityResponse(
        property_id=property_id,
        start_date=start_date,
        end_date=end_date,
        units=results,
    )


async def block_unit(
    session: AsyncSession, tenant: TenantContext, data: BlockRequest
) -> BlockResponse:
    await _get_unit(session, tenant, data.property_id, data.unit_id)
    dates = _daterange_inclusive(data.start_date, data.end_date)
    rows = await _upsert_days(
        session,
        tenant.organization_id,
        data.property_id,
        data.unit_id,
        dates,
        data.status,
    )
    await session.commit()
    return BlockResponse(
        unit_id=data.unit_id,
        start_date=data.start_date,
        end_date=data.end_date,
        status=data.status,
        days=[AvailabilityDayResponse.model_validate(r) for r in rows],
    )


async def unblock_unit(
    session: AsyncSession, tenant: TenantContext, data: UnblockRequest
) -> BlockResponse:
    await _get_unit(session, tenant, data.property_id, data.unit_id)
    dates = _daterange_inclusive(data.start_date, data.end_date)
    await repository.set_available_days(session, tenant.organization_id, data.unit_id, dates)
    await session.commit()
    return BlockResponse(
        unit_id=data.unit_id,
        start_date=data.start_date,
        end_date=data.end_date,
        status=AvailabilityStatus.AVAILABLE,
        days=[],
    )


async def _upsert_days(
    session: AsyncSession,
    org_id: uuid.UUID,
    property_id: uuid.UUID,
    unit_id: uuid.UUID,
    dates: list[date],
    status: AvailabilityStatus,
) -> list[UnitAvailability]:
    if not dates:
        return []
    values = [
        {
            "organization_id": org_id,
            "property_id": property_id,
            "unit_id": unit_id,
            "date": day,
            "status": status,
        }
        for day in dates
    ]
    stmt = insert(UnitAvailability).values(values)
    stmt = stmt.on_conflict_do_update(
        constraint="uq_unit_availability_unit_id_date",
        set_={"status": status, "updated_at": func.now()},
    )
    await session.execute(stmt)
    await session.flush()
    result = await session.scalars(
        select(UnitAvailability).where(
            UnitAvailability.organization_id == org_id,
            UnitAvailability.unit_id == unit_id,
            UnitAvailability.date.in_(dates),
        )
    )
    return list(result)


async def assert_units_bookable(
    session: AsyncSession,
    tenant: TenantContext,
    unit_ids: list[uuid.UUID],
    check_in: date,
    check_out: date,
) -> None:
    """Raise if any unit is maintenance-blocked for the stay (booking gate)."""
    if not unit_ids:
        return
    last_night = check_out - timedelta(days=1)
    blocked = await repository.find_unavailable_unit_ids(
        session, tenant.organization_id, unit_ids, check_in, last_night
    )
    if blocked:
        raise ConflictError(
            "Units are blocked or under maintenance for the selected dates: "
            + ", ".join(str(u) for u in sorted(blocked))
        )

    # Unit-level status (not date-specific).
    units = await properties_repository.list_units(session, tenant.organization_id)
    for unit in units:
        if unit.id in unit_ids and unit.status is not UnitStatus.AVAILABLE:
            raise ConflictError(
                f"Unit {unit.code} is {unit.status.value} and cannot be booked"
            )


# --- Pricing rules ----------------------------------------------------------------


async def list_pricing_rules(
    session: AsyncSession,
    tenant: TenantContext,
    property_id: uuid.UUID | None,
    unit_type_id: uuid.UUID | None,
) -> list[PricingRule]:
    return await repository.list_pricing_rules(
        session, tenant.organization_id, property_id, unit_type_id
    )


async def create_pricing_rule(
    session: AsyncSession, tenant: TenantContext, data: PricingRuleCreate
) -> PricingRule:
    if await properties_repository.get_property(
        session, tenant.organization_id, data.property_id
    ) is None:
        raise NotFoundError("Property not found")
    unit_type = await _get_unit_type(session, tenant, data.unit_type_id)
    if unit_type.property_id != data.property_id:
        raise ConflictError("Unit type belongs to a different property")

    rule = PricingRule(organization_id=tenant.organization_id, **data.model_dump())
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return rule


async def update_pricing_rule(
    session: AsyncSession,
    tenant: TenantContext,
    rule_id: uuid.UUID,
    data: PricingRuleUpdate,
) -> PricingRule:
    rule = await repository.get_pricing_rule(session, tenant.organization_id, rule_id)
    if rule is None:
        raise NotFoundError("Pricing rule not found")

    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(rule, field, value)

    if rule.end_date < rule.start_date:
        raise ConflictError("end_date must be on or after start_date")
    if rule.amount is None and rule.percentage is None:
        raise ConflictError("Provide amount, percentage, or both")

    await session.commit()
    await session.refresh(rule)
    return rule


async def delete_pricing_rule(
    session: AsyncSession, tenant: TenantContext, rule_id: uuid.UUID
) -> None:
    rule = await repository.get_pricing_rule(session, tenant.organization_id, rule_id)
    if rule is None:
        raise NotFoundError("Pricing rule not found")
    await session.delete(rule)
    await session.commit()
