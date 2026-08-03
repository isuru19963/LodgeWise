import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.guests.models import IdentificationType


class GuestCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    country: str | None = Field(default=None, max_length=100)
    identification_type: IdentificationType | None = None
    identification_number: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class GuestUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    country: str | None = Field(default=None, max_length=100)
    identification_type: IdentificationType | None = None
    identification_number: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class GuestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    first_name: str
    last_name: str
    email: str | None
    phone: str | None
    country: str | None
    identification_type: IdentificationType | None
    identification_number: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
