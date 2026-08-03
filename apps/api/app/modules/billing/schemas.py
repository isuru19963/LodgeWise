import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.billing.models import InvoiceStatus, SubscriptionStatus

# --- Plans ------------------------------------------------------------------------


class PlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    price_monthly: Decimal
    price_yearly: Decimal
    max_properties: int
    max_users: int
    features: dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime


# --- Subscriptions ----------------------------------------------------------------


class SubscriptionCreate(BaseModel):
    plan_id: uuid.UUID
    billing_cycle: str = Field(default="monthly", pattern="^(monthly|yearly)$")
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE

    @model_validator(mode="after")
    def _validate(self) -> Self:
        if self.status not in (SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE):
            raise ValueError("New subscriptions must be trial or active")
        return self


class SubscriptionUpdate(BaseModel):
    plan_id: uuid.UUID | None = None
    status: SubscriptionStatus | None = None
    end_date: date | None = None
    next_billing_date: date | None = None


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    plan_id: uuid.UUID
    status: SubscriptionStatus
    start_date: date
    end_date: date | None
    next_billing_date: date | None
    created_at: datetime
    updated_at: datetime
    plan: PlanResponse | None = None


# --- Invoices ---------------------------------------------------------------------


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    subscription_id: uuid.UUID
    invoice_number: str
    amount: Decimal
    currency: str
    status: InvoiceStatus
    issue_date: date
    due_date: date
    paid_date: date | None
    created_at: datetime
