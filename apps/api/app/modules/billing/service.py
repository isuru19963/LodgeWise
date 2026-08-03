import calendar
import secrets
import string
import uuid
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.modules.auth.dependencies import TenantContext
from app.modules.billing import repository
from app.modules.billing.models import (
    Invoice,
    InvoiceStatus,
    Plan,
    Subscription,
    SubscriptionStatus,
)
from app.modules.billing.schemas import SubscriptionCreate, SubscriptionUpdate

_INVOICE_ALPHABET = string.ascii_uppercase + string.digits
_TRIAL_DAYS = 14


def _add_months(start: date, months: int) -> date:
    month = start.month - 1 + months
    year = start.year + month // 12
    month = month % 12 + 1
    day = min(start.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _add_billing_period(start: date, cycle: str) -> date:
    return _add_months(start, 12 if cycle == "yearly" else 1)


async def _next_invoice_number(session: AsyncSession) -> str:
    for _ in range(5):
        number = "INV-" + "".join(secrets.choice(_INVOICE_ALPHABET) for _ in range(8))
        if not await repository.invoice_number_exists(session, number):
            return number
    raise ConflictError("Could not generate a unique invoice number")


async def list_plans(session: AsyncSession) -> list[Plan]:
    return await repository.list_active_plans(session)


async def get_current_subscription(
    session: AsyncSession, tenant: TenantContext
) -> Subscription:
    sub = await repository.get_live_subscription(session, tenant.organization_id)
    if sub is None:
        raise NotFoundError("No active subscription")
    return sub


async def create_subscription(
    session: AsyncSession, tenant: TenantContext, data: SubscriptionCreate
) -> Subscription:
    plan = await repository.get_plan(session, data.plan_id)
    if plan is None or not plan.is_active:
        raise NotFoundError("Plan not found")

    await _assert_plan_fits_usage(session, tenant.organization_id, plan)

    today = date.today()
    await repository.cancel_live_subscriptions(session, tenant.organization_id, today)

    next_billing = (
        None
        if data.status is SubscriptionStatus.TRIAL
        else _add_billing_period(today, data.billing_cycle)
    )
    end_date = (
        today + timedelta(days=_TRIAL_DAYS)
        if data.status is SubscriptionStatus.TRIAL
        else None
    )

    subscription = Subscription(
        organization_id=tenant.organization_id,
        plan_id=plan.id,
        status=data.status,
        start_date=today,
        end_date=end_date,
        next_billing_date=next_billing,
    )
    session.add(subscription)
    await session.flush()

    # Foundation invoices only — no gateway charge. Paid plans get a PENDING
    # invoice for the first period; free/trial create none.
    price = plan.price_yearly if data.billing_cycle == "yearly" else plan.price_monthly
    if data.status is SubscriptionStatus.ACTIVE and price > 0:
        session.add(
            Invoice(
                organization_id=tenant.organization_id,
                subscription_id=subscription.id,
                invoice_number=await _next_invoice_number(session),
                amount=price,
                currency="USD",
                status=InvoiceStatus.PENDING,
                issue_date=today,
                due_date=today + timedelta(days=7),
            )
        )

    await session.commit()
    return await get_current_subscription(session, tenant)


async def update_subscription(
    session: AsyncSession,
    tenant: TenantContext,
    subscription_id: uuid.UUID,
    data: SubscriptionUpdate,
) -> Subscription:
    subscription = await repository.get_subscription(
        session, tenant.organization_id, subscription_id
    )
    if subscription is None:
        raise NotFoundError("Subscription not found")

    changes = data.model_dump(exclude_unset=True)

    if "plan_id" in changes:
        plan = await repository.get_plan(session, changes["plan_id"])
        if plan is None or not plan.is_active:
            raise NotFoundError("Plan not found")
        await _assert_plan_fits_usage(session, tenant.organization_id, plan)

    if changes.get("status") is SubscriptionStatus.CANCELLED and subscription.end_date is None:
        changes.setdefault("end_date", date.today())

    for field, value in changes.items():
        setattr(subscription, field, value)

    await session.commit()
    refreshed = await repository.get_subscription(
        session, tenant.organization_id, subscription.id
    )
    assert refreshed is not None
    return refreshed


async def list_invoices(session: AsyncSession, tenant: TenantContext) -> list[Invoice]:
    return await repository.list_invoices(session, tenant.organization_id)


async def get_invoice(
    session: AsyncSession, tenant: TenantContext, invoice_id: uuid.UUID
) -> Invoice:
    invoice = await repository.get_invoice(session, tenant.organization_id, invoice_id)
    if invoice is None:
        raise NotFoundError("Invoice not found")
    return invoice


async def start_free_trial(session: AsyncSession, organization_id: uuid.UUID) -> Subscription:
    """Called during registration — every org starts on FREE / TRIAL."""
    plan = await repository.get_plan_by_name(session, "FREE")
    if plan is None:
        raise NotFoundError("FREE plan is not configured")

    today = date.today()
    subscription = Subscription(
        organization_id=organization_id,
        plan_id=plan.id,
        status=SubscriptionStatus.TRIAL,
        start_date=today,
        end_date=today + timedelta(days=_TRIAL_DAYS),
        next_billing_date=None,
    )
    session.add(subscription)
    await session.flush()
    return subscription


async def _assert_plan_fits_usage(
    session: AsyncSession, org_id: uuid.UUID, plan: Plan
) -> None:
    properties = await repository.count_properties(session, org_id)
    users = await repository.count_users(session, org_id)
    if properties > plan.max_properties:
        raise ConflictError(
            f"Plan '{plan.name}' allows {plan.max_properties} properties; "
            f"organization currently has {properties}"
        )
    if users > plan.max_users:
        raise ConflictError(
            f"Plan '{plan.name}' allows {plan.max_users} users; "
            f"organization currently has {users}"
        )


async def assert_can_add_property(session: AsyncSession, tenant: TenantContext) -> None:
    """Enforce max_properties against the live subscription plan."""
    plan = await _require_live_plan(session, tenant)
    current = await repository.count_properties(session, tenant.organization_id)
    if current >= plan.max_properties:
        raise ForbiddenError(
            f"Property limit reached ({plan.max_properties}) for plan '{plan.name}'"
        )


async def assert_can_add_user(session: AsyncSession, tenant: TenantContext) -> None:
    """Enforce max_users against the live subscription plan."""
    plan = await _require_live_plan(session, tenant)
    current = await repository.count_users(session, tenant.organization_id)
    if current >= plan.max_users:
        raise ForbiddenError(
            f"User limit reached ({plan.max_users}) for plan '{plan.name}'"
        )


async def _require_live_plan(session: AsyncSession, tenant: TenantContext) -> Plan:
    sub = await repository.get_live_subscription(session, tenant.organization_id)
    if sub is None or sub.plan is None:
        raise ForbiddenError("No active subscription — subscribe to a plan to continue")
    if not sub.plan.is_active:
        raise ForbiddenError("Current plan is no longer available")
    return sub.plan
