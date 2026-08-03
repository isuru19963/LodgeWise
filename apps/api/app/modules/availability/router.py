import uuid
from datetime import date

from fastapi import APIRouter, Query, status

from app.core.exceptions import ConflictError
from app.models import UserRole
from app.modules.auth.dependencies import CurrentTenant, TenantDB, require_role
from app.modules.availability import service
from app.modules.availability.schemas import (
    AvailabilityResponse,
    BlockRequest,
    BlockResponse,
    PricingRuleCreate,
    PricingRuleResponse,
    PricingRuleUpdate,
    UnblockRequest,
)

router = APIRouter(tags=["availability"])


# --- Availability -----------------------------------------------------------------


@router.get("/availability", response_model=AvailabilityResponse)
async def get_availability(
    tenant: CurrentTenant,
    session: TenantDB,
    property_id: uuid.UUID = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
    unit_type_id: uuid.UUID | None = Query(default=None),
) -> AvailabilityResponse:
    if end_date <= start_date:
        raise ConflictError("end_date must be after start_date")
    return await service.get_availability(
        session, tenant, property_id, start_date, end_date, unit_type_id
    )


@router.post(
    "/availability/block",
    response_model=BlockResponse,
    dependencies=[require_role(UserRole.MANAGER)],
)
async def block_unit(
    data: BlockRequest, tenant: CurrentTenant, session: TenantDB
) -> BlockResponse:
    return await service.block_unit(session, tenant, data)


@router.post(
    "/availability/unblock",
    response_model=BlockResponse,
    dependencies=[require_role(UserRole.MANAGER)],
)
async def unblock_unit(
    data: UnblockRequest, tenant: CurrentTenant, session: TenantDB
) -> BlockResponse:
    return await service.unblock_unit(session, tenant, data)


# --- Pricing rules ----------------------------------------------------------------


@router.post(
    "/pricing-rules",
    response_model=PricingRuleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_role(UserRole.MANAGER)],
)
async def create_pricing_rule(
    data: PricingRuleCreate, tenant: CurrentTenant, session: TenantDB
) -> PricingRuleResponse:
    rule = await service.create_pricing_rule(session, tenant, data)
    return PricingRuleResponse.model_validate(rule)


@router.get("/pricing-rules", response_model=list[PricingRuleResponse])
async def list_pricing_rules(
    tenant: CurrentTenant,
    session: TenantDB,
    property_id: uuid.UUID | None = Query(default=None),
    unit_type_id: uuid.UUID | None = Query(default=None),
) -> list[PricingRuleResponse]:
    rules = await service.list_pricing_rules(session, tenant, property_id, unit_type_id)
    return [PricingRuleResponse.model_validate(r) for r in rules]


@router.put(
    "/pricing-rules/{rule_id}",
    response_model=PricingRuleResponse,
    dependencies=[require_role(UserRole.MANAGER)],
)
async def update_pricing_rule(
    rule_id: uuid.UUID,
    data: PricingRuleUpdate,
    tenant: CurrentTenant,
    session: TenantDB,
) -> PricingRuleResponse:
    rule = await service.update_pricing_rule(session, tenant, rule_id, data)
    return PricingRuleResponse.model_validate(rule)


@router.delete(
    "/pricing-rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[require_role(UserRole.MANAGER)],
)
async def delete_pricing_rule(
    rule_id: uuid.UUID, tenant: CurrentTenant, session: TenantDB
) -> None:
    await service.delete_pricing_rule(session, tenant, rule_id)
