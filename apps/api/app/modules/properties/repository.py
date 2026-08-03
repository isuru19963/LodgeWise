"""Data access for the properties module.

Every function that touches tenant-owned tables takes the organization id and
applies it in the WHERE clause — no query runs unscoped (see
docs/DATABASE_DESIGN.md § 1).
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.properties.models import Property, PropertyType, Unit, UnitType

# --- Property types (global catalog) -------------------------------------------


async def list_property_types(session: AsyncSession) -> list[PropertyType]:
    result = await session.scalars(select(PropertyType).order_by(PropertyType.name))
    return list(result)


async def get_property_type(session: AsyncSession, type_id: uuid.UUID) -> PropertyType | None:
    return await session.get(PropertyType, type_id)


# --- Properties -----------------------------------------------------------------


async def list_properties(session: AsyncSession, org_id: uuid.UUID) -> list[Property]:
    result = await session.scalars(
        select(Property).where(Property.organization_id == org_id).order_by(Property.created_at)
    )
    return list(result)


async def get_property(
    session: AsyncSession, org_id: uuid.UUID, property_id: uuid.UUID
) -> Property | None:
    return await session.scalar(
        select(Property).where(Property.id == property_id, Property.organization_id == org_id)
    )


# --- Unit types ------------------------------------------------------------------


async def list_unit_types(
    session: AsyncSession, org_id: uuid.UUID, property_id: uuid.UUID | None = None
) -> list[UnitType]:
    query = select(UnitType).where(UnitType.organization_id == org_id)
    if property_id is not None:
        query = query.where(UnitType.property_id == property_id)
    result = await session.scalars(query.order_by(UnitType.created_at))
    return list(result)


async def get_unit_type(
    session: AsyncSession, org_id: uuid.UUID, unit_type_id: uuid.UUID
) -> UnitType | None:
    return await session.scalar(
        select(UnitType).where(
            UnitType.id == unit_type_id, UnitType.organization_id == org_id
        )
    )


async def unit_type_name_exists(
    session: AsyncSession, property_id: uuid.UUID, name: str
) -> bool:
    row = await session.scalar(
        select(UnitType.id).where(UnitType.property_id == property_id, UnitType.name == name)
    )
    return row is not None


# --- Units ------------------------------------------------------------------------


async def list_units(
    session: AsyncSession,
    org_id: uuid.UUID,
    property_id: uuid.UUID | None = None,
    unit_type_id: uuid.UUID | None = None,
) -> list[Unit]:
    query = select(Unit).where(Unit.organization_id == org_id)
    if property_id is not None:
        query = query.where(Unit.property_id == property_id)
    if unit_type_id is not None:
        query = query.where(Unit.unit_type_id == unit_type_id)
    result = await session.scalars(query.order_by(Unit.code))
    return list(result)


async def unit_code_exists(session: AsyncSession, property_id: uuid.UUID, code: str) -> bool:
    row = await session.scalar(
        select(Unit.id).where(Unit.property_id == property_id, Unit.code == code)
    )
    return row is not None
