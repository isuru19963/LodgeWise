import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.auth.dependencies import TenantContext
from app.modules.properties import repository
from app.modules.properties.models import Property, PropertyType, Unit, UnitType
from app.modules.properties.schemas import (
    PropertyCreate,
    PropertyUpdate,
    UnitCreate,
    UnitTypeCreate,
)

# --- Property types -------------------------------------------------------------


async def list_property_types(session: AsyncSession) -> list[PropertyType]:
    return await repository.list_property_types(session)


# --- Properties ------------------------------------------------------------------


async def list_properties(session: AsyncSession, tenant: TenantContext) -> list[Property]:
    return await repository.list_properties(session, tenant.organization_id)


async def get_property(
    session: AsyncSession, tenant: TenantContext, property_id: uuid.UUID
) -> Property:
    prop = await repository.get_property(session, tenant.organization_id, property_id)
    if prop is None:
        raise NotFoundError("Property not found")
    return prop


async def create_property(
    session: AsyncSession, tenant: TenantContext, data: PropertyCreate
) -> Property:
    if await repository.get_property_type(session, data.property_type_id) is None:
        raise NotFoundError("Property type not found")

    prop = Property(organization_id=tenant.organization_id, **data.model_dump())
    session.add(prop)
    await session.commit()
    await session.refresh(prop)
    return prop


async def update_property(
    session: AsyncSession, tenant: TenantContext, property_id: uuid.UUID, data: PropertyUpdate
) -> Property:
    prop = await get_property(session, tenant, property_id)

    changes = data.model_dump(exclude_unset=True)
    if "property_type_id" in changes:
        if await repository.get_property_type(session, changes["property_type_id"]) is None:
            raise NotFoundError("Property type not found")

    for field, value in changes.items():
        setattr(prop, field, value)

    await session.commit()
    await session.refresh(prop)
    return prop


async def delete_property(
    session: AsyncSession, tenant: TenantContext, property_id: uuid.UUID
) -> None:
    prop = await get_property(session, tenant, property_id)
    await session.delete(prop)  # cascades to unit_types and units
    await session.commit()


# --- Unit types --------------------------------------------------------------------


async def list_unit_types(
    session: AsyncSession, tenant: TenantContext, property_id: uuid.UUID | None
) -> list[UnitType]:
    return await repository.list_unit_types(session, tenant.organization_id, property_id)


async def create_unit_type(
    session: AsyncSession, tenant: TenantContext, data: UnitTypeCreate
) -> UnitType:
    await get_property(session, tenant, data.property_id)  # tenant ownership check

    if await repository.unit_type_name_exists(session, data.property_id, data.name):
        raise ConflictError("A unit type with this name already exists for this property")

    unit_type = UnitType(organization_id=tenant.organization_id, **data.model_dump())
    session.add(unit_type)
    await session.commit()
    await session.refresh(unit_type)
    return unit_type


# --- Units ---------------------------------------------------------------------------


async def list_units(
    session: AsyncSession,
    tenant: TenantContext,
    property_id: uuid.UUID | None,
    unit_type_id: uuid.UUID | None,
) -> list[Unit]:
    return await repository.list_units(
        session, tenant.organization_id, property_id, unit_type_id
    )


async def create_unit(session: AsyncSession, tenant: TenantContext, data: UnitCreate) -> Unit:
    await get_property(session, tenant, data.property_id)  # tenant ownership check

    unit_type = await repository.get_unit_type(session, tenant.organization_id, data.unit_type_id)
    if unit_type is None:
        raise NotFoundError("Unit type not found")
    if unit_type.property_id != data.property_id:
        raise ConflictError("Unit type belongs to a different property")

    if await repository.unit_code_exists(session, data.property_id, data.code):
        raise ConflictError("A unit with this code already exists for this property")

    unit = Unit(organization_id=tenant.organization_id, **data.model_dump())
    session.add(unit)
    await session.commit()
    await session.refresh(unit)
    return unit
