import uuid
from datetime import datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.properties.models import UnitStatus

# --- Property types -----------------------------------------------------------


class PropertyTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    created_at: datetime


# --- Properties ---------------------------------------------------------------


class PropertyCreate(BaseModel):
    property_type_id: uuid.UUID
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None
    address: str | None = Field(default=None, max_length=300)
    city: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=32)
    email: EmailStr | None = None
    timezone: str = Field(default="UTC", max_length=64)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    check_in_time: time = time(14, 0)
    check_out_time: time = time(11, 0)


class PropertyUpdate(BaseModel):
    property_type_id: uuid.UUID | None = None
    name: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None
    address: str | None = Field(default=None, max_length=300)
    city: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=32)
    email: EmailStr | None = None
    timezone: str | None = Field(default=None, max_length=64)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    check_in_time: time | None = None
    check_out_time: time | None = None


class PropertyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    property_type_id: uuid.UUID
    name: str
    description: str | None
    address: str | None
    city: str | None
    country: str | None
    phone: str | None
    email: str | None
    timezone: str
    currency: str
    check_in_time: time
    check_out_time: time
    created_at: datetime
    updated_at: datetime


# --- Unit types ---------------------------------------------------------------


class UnitTypeCreate(BaseModel):
    property_id: uuid.UUID
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    max_adults: int = Field(default=2, ge=1, le=50)
    max_children: int = Field(default=0, ge=0, le=50)
    base_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class UnitTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    property_id: uuid.UUID
    name: str
    description: str | None
    max_adults: int
    max_children: int
    base_price: Decimal
    created_at: datetime


# --- Units ---------------------------------------------------------------------


class UnitCreate(BaseModel):
    property_id: uuid.UUID
    unit_type_id: uuid.UUID
    name: str = Field(min_length=1, max_length=100)
    code: str = Field(min_length=1, max_length=50)
    status: UnitStatus = UnitStatus.AVAILABLE


class UnitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    property_id: uuid.UUID
    unit_type_id: uuid.UUID
    name: str
    code: str
    status: UnitStatus
    created_at: datetime
    updated_at: datetime
