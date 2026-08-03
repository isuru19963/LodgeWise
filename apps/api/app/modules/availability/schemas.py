import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.availability.models import AvailabilityStatus, PricingRuleType

# --- Availability -----------------------------------------------------------------


class AvailabilityQuery(BaseModel):
    property_id: uuid.UUID
    unit_type_id: uuid.UUID | None = None
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def _validate(self) -> Self:
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class AppliedRule(BaseModel):
    id: uuid.UUID
    name: str
    rule_type: PricingRuleType
    amount: Decimal | None
    percentage: Decimal | None


class NightlyPrice(BaseModel):
    date: date
    base_price: Decimal
    final_price: Decimal
    applied_rules: list[AppliedRule]


class AvailableUnit(BaseModel):
    unit_id: uuid.UUID
    property_id: uuid.UUID
    unit_type_id: uuid.UUID
    name: str
    code: str
    base_price: Decimal
    nights: list[NightlyPrice]
    total_price: Decimal


class AvailabilityResponse(BaseModel):
    property_id: uuid.UUID
    start_date: date
    end_date: date
    units: list[AvailableUnit]


class BlockRequest(BaseModel):
    property_id: uuid.UUID
    unit_id: uuid.UUID
    start_date: date
    end_date: date
    status: AvailabilityStatus = AvailabilityStatus.BLOCKED

    @model_validator(mode="after")
    def _validate(self) -> Self:
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        if self.status is AvailabilityStatus.AVAILABLE:
            raise ValueError("Use /availability/unblock to mark dates available")
        return self


class UnblockRequest(BaseModel):
    property_id: uuid.UUID
    unit_id: uuid.UUID
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def _validate(self) -> Self:
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class AvailabilityDayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    unit_id: uuid.UUID
    date: date
    status: AvailabilityStatus
    created_at: datetime
    updated_at: datetime


class BlockResponse(BaseModel):
    unit_id: uuid.UUID
    start_date: date
    end_date: date
    status: AvailabilityStatus
    days: list[AvailabilityDayResponse]


# --- Pricing rules ----------------------------------------------------------------


class PricingRuleCreate(BaseModel):
    property_id: uuid.UUID
    unit_type_id: uuid.UUID
    name: str = Field(min_length=1, max_length=150)
    rule_type: PricingRuleType
    start_date: date
    end_date: date
    amount: Decimal | None = Field(default=None, max_digits=12, decimal_places=2)
    percentage: Decimal | None = Field(default=None, max_digits=7, decimal_places=2)

    @model_validator(mode="after")
    def _validate(self) -> Self:
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        if self.amount is None and self.percentage is None:
            raise ValueError("Provide amount, percentage, or both")
        return self


class PricingRuleUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    rule_type: PricingRuleType | None = None
    start_date: date | None = None
    end_date: date | None = None
    amount: Decimal | None = Field(default=None, max_digits=12, decimal_places=2)
    percentage: Decimal | None = Field(default=None, max_digits=7, decimal_places=2)

    @model_validator(mode="after")
    def _validate(self) -> Self:
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError("end_date must be on or after start_date")
        return self


class PricingRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    property_id: uuid.UUID
    unit_type_id: uuid.UUID
    name: str
    rule_type: PricingRuleType
    start_date: date
    end_date: date
    amount: Decimal | None
    percentage: Decimal | None
    created_at: datetime
    updated_at: datetime
