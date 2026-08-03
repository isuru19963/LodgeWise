import uuid

from fastapi import APIRouter, Query, status

from app.models import UserRole
from app.modules.auth.dependencies import CurrentTenant, TenantDB, require_role
from app.modules.properties import service
from app.modules.properties.schemas import (
    PropertyCreate,
    PropertyResponse,
    PropertyTypeResponse,
    PropertyUpdate,
    UnitCreate,
    UnitResponse,
    UnitTypeCreate,
    UnitTypeResponse,
)

router = APIRouter(tags=["properties"])

# --- Property types (global catalog, any authenticated member) -----------------


@router.get("/property-types", response_model=list[PropertyTypeResponse])
async def list_property_types(_: CurrentTenant, session: TenantDB) -> list[PropertyTypeResponse]:
    types = await service.list_property_types(session)
    return [PropertyTypeResponse.model_validate(t) for t in types]


# --- Properties -----------------------------------------------------------------


@router.post(
    "/properties",
    response_model=PropertyResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_role(UserRole.ADMIN)],
)
async def create_property(
    data: PropertyCreate, tenant: CurrentTenant, session: TenantDB
) -> PropertyResponse:
    prop = await service.create_property(session, tenant, data)
    return PropertyResponse.model_validate(prop)


@router.get("/properties", response_model=list[PropertyResponse])
async def list_properties(tenant: CurrentTenant, session: TenantDB) -> list[PropertyResponse]:
    properties = await service.list_properties(session, tenant)
    return [PropertyResponse.model_validate(p) for p in properties]


@router.get("/properties/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: uuid.UUID, tenant: CurrentTenant, session: TenantDB
) -> PropertyResponse:
    prop = await service.get_property(session, tenant, property_id)
    return PropertyResponse.model_validate(prop)


@router.put(
    "/properties/{property_id}",
    response_model=PropertyResponse,
    dependencies=[require_role(UserRole.MANAGER)],
)
async def update_property(
    property_id: uuid.UUID, data: PropertyUpdate, tenant: CurrentTenant, session: TenantDB
) -> PropertyResponse:
    prop = await service.update_property(session, tenant, property_id, data)
    return PropertyResponse.model_validate(prop)


@router.delete(
    "/properties/{property_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[require_role(UserRole.ADMIN)],
)
async def delete_property(
    property_id: uuid.UUID, tenant: CurrentTenant, session: TenantDB
) -> None:
    await service.delete_property(session, tenant, property_id)


# --- Unit types --------------------------------------------------------------------


@router.post(
    "/unit-types",
    response_model=UnitTypeResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_role(UserRole.MANAGER)],
)
async def create_unit_type(
    data: UnitTypeCreate, tenant: CurrentTenant, session: TenantDB
) -> UnitTypeResponse:
    unit_type = await service.create_unit_type(session, tenant, data)
    return UnitTypeResponse.model_validate(unit_type)


@router.get("/unit-types", response_model=list[UnitTypeResponse])
async def list_unit_types(
    tenant: CurrentTenant,
    session: TenantDB,
    property_id: uuid.UUID | None = Query(default=None),
) -> list[UnitTypeResponse]:
    unit_types = await service.list_unit_types(session, tenant, property_id)
    return [UnitTypeResponse.model_validate(u) for u in unit_types]


# --- Units ----------------------------------------------------------------------------


@router.post(
    "/units",
    response_model=UnitResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_role(UserRole.MANAGER)],
)
async def create_unit(data: UnitCreate, tenant: CurrentTenant, session: TenantDB) -> UnitResponse:
    unit = await service.create_unit(session, tenant, data)
    return UnitResponse.model_validate(unit)


@router.get("/units", response_model=list[UnitResponse])
async def list_units(
    tenant: CurrentTenant,
    session: TenantDB,
    property_id: uuid.UUID | None = Query(default=None),
    unit_type_id: uuid.UUID | None = Query(default=None),
) -> list[UnitResponse]:
    units = await service.list_units(session, tenant, property_id, unit_type_id)
    return [UnitResponse.model_validate(u) for u in units]
