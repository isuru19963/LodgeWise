import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from app.database.base import Base, TimestampMixin


class IdentificationType(str, enum.Enum):
    PASSPORT = "passport"
    NATIONAL_ID = "national_id"
    DRIVING_LICENSE = "driving_license"
    OTHER = "other"


class Guest(Base, TimestampMixin):
    """A guest profile, scoped to the organization (not to a property).

    The same guest profile is reused across all of the tenant's properties,
    giving portfolio operators one stay history per person.
    """

    __tablename__ = "guests"
    __table_args__ = (
        # Email is optional, but when present it must be unique per tenant.
        Index(
            "uq_guests_organization_id_email",
            "organization_id",
            "email",
            unique=True,
            postgresql_where=text("email IS NOT NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str | None] = mapped_column(String(320))
    phone: Mapped[str | None] = mapped_column(String(32))
    country: Mapped[str | None] = mapped_column(String(100))
    identification_type: Mapped[IdentificationType | None] = mapped_column(
        Enum(
            IdentificationType,
            name="identification_type",
            values_callable=lambda e: [m.value for m in e],
        )
    )
    identification_number: Mapped[str | None] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text)

    def __repr__(self) -> str:
        return f"<Guest {self.first_name} {self.last_name}>"
