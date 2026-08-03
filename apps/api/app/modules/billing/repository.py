import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.billing.models import (
    LIVE_SUBSCRIPTION_STATUSES,
    Invoice,
    Plan,
    Subscription,
    SubscriptionStatus,
)


async def list_active_plans(session: AsyncSession) -> list[Plan]:
    result = await session.scalars(
        select(Plan).where(Plan.is_active.is_(True)).order_by(Plan.price_monthly)
    )
    return list(result)


async def get_plan(session: AsyncSession, plan_id: uuid.UUID) -> Plan | None:
    return await session.get(Plan, plan_id)


async def get_plan_by_name(session: AsyncSession, name: str) -> Plan | None:
    return await session.scalar(select(Plan).where(Plan.name == name))


async def get_live_subscription(
    session: AsyncSession, org_id: uuid.UUID
) -> Subscription | None:
    return await session.scalar(
        select(Subscription)
        .where(
            Subscription.organization_id == org_id,
            Subscription.status.in_(LIVE_SUBSCRIPTION_STATUSES),
        )
        .options(selectinload(Subscription.plan))
        .order_by(Subscription.created_at.desc())
    )


async def get_subscription(
    session: AsyncSession, org_id: uuid.UUID, subscription_id: uuid.UUID
) -> Subscription | None:
    return await session.scalar(
        select(Subscription)
        .where(
            Subscription.id == subscription_id,
            Subscription.organization_id == org_id,
        )
        .options(selectinload(Subscription.plan))
    )


async def cancel_live_subscriptions(
    session: AsyncSession, org_id: uuid.UUID, as_of: date
) -> None:
    """Mark any TRIAL/ACTIVE subscription CANCELLED so a new one can take over."""
    live = await session.scalars(
        select(Subscription).where(
            Subscription.organization_id == org_id,
            Subscription.status.in_(LIVE_SUBSCRIPTION_STATUSES),
        )
    )
    for sub in live:
        sub.status = SubscriptionStatus.CANCELLED
        sub.end_date = as_of


async def list_invoices(session: AsyncSession, org_id: uuid.UUID) -> list[Invoice]:
    result = await session.scalars(
        select(Invoice)
        .where(Invoice.organization_id == org_id)
        .order_by(Invoice.issue_date.desc())
    )
    return list(result)


async def get_invoice(
    session: AsyncSession, org_id: uuid.UUID, invoice_id: uuid.UUID
) -> Invoice | None:
    return await session.scalar(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.organization_id == org_id)
    )


async def invoice_number_exists(session: AsyncSession, number: str) -> bool:
    return (
        await session.scalar(select(Invoice.id).where(Invoice.invoice_number == number))
    ) is not None


async def count_properties(session: AsyncSession, org_id: uuid.UUID) -> int:
    from app.modules.properties.models import Property
    from sqlalchemy import func

    return int(
        await session.scalar(
            select(func.count()).select_from(Property).where(Property.organization_id == org_id)
        )
        or 0
    )


async def count_users(session: AsyncSession, org_id: uuid.UUID) -> int:
    from app.models.user import User
    from sqlalchemy import func

    return int(
        await session.scalar(
            select(func.count()).select_from(User).where(User.organization_id == org_id)
        )
        or 0
    )
