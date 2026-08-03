import enum
import uuid
from datetime import datetime, time

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    SmallInteger,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid6 import uuid7

from app.database.base import Base, TimestampMixin


class PropertyType(Base):
    """Global lookup: the kinds of property the platform supports.

    Not tenant-owned — seeded by migration (HOTEL, RESORT, VILLA, CABANA,
    HOSTEL, GUEST_HOUSE, APARTMENT, OTHER).
    """

    __tablename__ = "property_types"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Property(Base, TimestampMixin):
    """A bookable property owned by an organization (tenant-isolated)."""

    __tablename__ = "properties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    property_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("property_types.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    address: Mapped[str | None] = mapped_column(String(300))
    city: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str | None] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(32))
    email: Mapped[str | None] = mapped_column(String(320))
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    check_in_time: Mapped[time] = mapped_column(Time, nullable=False, default=time(14, 0))
    check_out_time: Mapped[time] = mapped_column(Time, nullable=False, default=time(11, 0))

    property_type: Mapped[PropertyType] = relationship()
    unit_types: Mapped[list["UnitType"]] = relationship(
        back_populates="property", cascade="all, delete-orphan"
    )
    units: Mapped[list["Unit"]] = relationship(
        back_populates="property", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Property {self.name}>"


class UnitType(Base):
    """A sellable inventory class within a property (e.g. "Deluxe Room").

    Carries a denormalized organization_id so tenant isolation (and future
    RLS) never depends on a join (see docs/DATABASE_DESIGN.md § 3.2).
    """

    __tablename__ = "unit_types"
    __table_args__ = (UniqueConstraint("property_id", "name"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    max_adults: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=2)
    max_children: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    base_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    property: Mapped[Property] = relationship(back_populates="unit_types")
    units: Mapped[list["Unit"]] = relationship(back_populates="unit_type")


class UnitStatus(str, enum.Enum):
    AVAILABLE = "available"
    MAINTENANCE = "maintenance"
    OUT_OF_SERVICE = "out_of_service"


class Unit(Base, TimestampMixin):
    """A physical bookable unit: a room, a bed, or a whole villa."""

    __tablename__ = "units"
    __table_args__ = (UniqueConstraint("property_id", "code"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    unit_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("unit_types.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[UnitStatus] = mapped_column(
        Enum(UnitStatus, name="unit_status", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=UnitStatus.AVAILABLE,
    )

    property: Mapped[Property] = relationship(back_populates="units")
    unit_type: Mapped[UnitType] = relationship(back_populates="units")

    def __repr__(self) -> str:
        return f"<Unit {self.code}>"
