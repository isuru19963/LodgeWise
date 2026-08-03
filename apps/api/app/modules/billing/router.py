import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models import UserRole
from app.modules.auth.dependencies import CurrentTenant, TenantDB, require_role
from app.modules.billing import service
from app.modules.billing.schemas import (
    InvoiceResponse,
    PlanResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionUpdate,
)

router = APIRouter(tags=["billing"])


# --- Plans (global catalog) -------------------------------------------------------


@router.get("/plans", response_model=list[PlanResponse])
async def list_plans(session: AsyncSession = Depends(get_db)) -> list[PlanResponse]:
    """Public plan catalog — usable before and after authentication."""
    plans = await service.list_plans(session)
    return [PlanResponse.model_validate(p) for p in plans]


# --- Subscriptions ----------------------------------------------------------------


@router.post(
    "/subscriptions",
    response_model=SubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_role(UserRole.OWNER)],
)
async def create_subscription(
    data: SubscriptionCreate, tenant: CurrentTenant, session: TenantDB
) -> SubscriptionResponse:
    subscription = await service.create_subscription(session, tenant, data)
    return SubscriptionResponse.model_validate(subscription)


@router.get("/subscriptions/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    tenant: CurrentTenant, session: TenantDB
) -> SubscriptionResponse:
    subscription = await service.get_current_subscription(session, tenant)
    return SubscriptionResponse.model_validate(subscription)


@router.put(
    "/subscriptions/{subscription_id}",
    response_model=SubscriptionResponse,
    dependencies=[require_role(UserRole.OWNER)],
)
async def update_subscription(
    subscription_id: uuid.UUID,
    data: SubscriptionUpdate,
    tenant: CurrentTenant,
    session: TenantDB,
) -> SubscriptionResponse:
    subscription = await service.update_subscription(
        session, tenant, subscription_id, data
    )
    return SubscriptionResponse.model_validate(subscription)


# --- Invoices ---------------------------------------------------------------------


@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_invoices(tenant: CurrentTenant, session: TenantDB) -> list[InvoiceResponse]:
    invoices = await service.list_invoices(session, tenant)
    return [InvoiceResponse.model_validate(i) for i in invoices]


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: uuid.UUID, tenant: CurrentTenant, session: TenantDB
) -> InvoiceResponse:
    invoice = await service.get_invoice(session, tenant, invoice_id)
    return InvoiceResponse.model_validate(invoice)
