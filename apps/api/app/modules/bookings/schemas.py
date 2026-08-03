import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.bookings.models import BookingStatus, PaymentStatus

# --- Booking items --------------------------------------------------------------


class BookingItemCreate(BaseModel):
    unit_id: uuid.UUID
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    quantity: int = Field(default=1, ge=1, le=100)


class BookingItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    unit_id: uuid.UUID
    price: Decimal
    quantity: int


# --- Bookings ---------------------------------------------------------------------


class BookingCreate(BaseModel):
    property_id: uuid.UUID
    guest_id: uuid.UUID
    check_in_date: date
    check_out_date: date
    adults: int = Field(default=1, ge=1, le=100)
    children: int = Field(default=0, ge=0, le=100)
    status: BookingStatus = BookingStatus.PENDING
    items: list[BookingItemCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def _validate(self) -> Self:
        if self.check_out_date <= self.check_in_date:
            raise ValueError("check_out_date must be after check_in_date")
        if self.status not in (BookingStatus.PENDING, BookingStatus.CONFIRMED):
            raise ValueError("A new booking can only be created as pending or confirmed")
        unit_ids = [item.unit_id for item in self.items]
        if len(unit_ids) != len(set(unit_ids)):
            raise ValueError("The same unit cannot appear twice in one booking")
        return self


class BookingUpdate(BaseModel):
    check_in_date: date | None = None
    check_out_date: date | None = None
    adults: int | None = Field(default=None, ge=1, le=100)
    children: int | None = Field(default=None, ge=0, le=100)
    status: BookingStatus | None = None
    payment_status: PaymentStatus | None = None
    items: list[BookingItemCreate] | None = Field(default=None, min_length=1)

    @model_validator(mode="after")
    def _validate(self) -> Self:
        if (
            self.check_in_date is not None
            and self.check_out_date is not None
            and self.check_out_date <= self.check_in_date
        ):
            raise ValueError("check_out_date must be after check_in_date")
        if self.items is not None:
            unit_ids = [item.unit_id for item in self.items]
            if len(unit_ids) != len(set(unit_ids)):
                raise ValueError("The same unit cannot appear twice in one booking")
        return self


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    property_id: uuid.UUID
    guest_id: uuid.UUID
    booking_reference: str
    check_in_date: date
    check_out_date: date
    adults: int
    children: int
    status: BookingStatus
    total_amount: Decimal
    payment_status: PaymentStatus
    items: list[BookingItemResponse]
    created_at: datetime
    updated_at: datetime
