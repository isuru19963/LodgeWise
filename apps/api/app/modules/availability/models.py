import enum
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    Enum,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from app.database.base import Base, TimestampMixin


class AvailabilityStatus(str, enum.Enum):
    AVAILABLE = "available"
    BLOCKED = "blocked"
    MAINTENANCE = "maintenance"


class PricingRuleType(str, enum.Enum):
    SEASONAL = "seasonal"
    WEEKEND = "weekend"
    HOLIDAY = "holiday"
    SPECIAL = "special"


class UnitAvailability(Base, TimestampMixin):
    """Daily availability override for a physical unit.

    Absence of a row means the unit is available that day (unless an active
    booking or the unit's own status says otherwise).
    """

    __tablename__ = "unit_availability"
    __table_args__ = (
        UniqueConstraint("unit_id", "date", name="uq_unit_availability_unit_id_date"),
    )

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
    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("units.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[AvailabilityStatus] = mapped_column(
        Enum(
            AvailabilityStatus,
            name="availability_status",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=AvailabilityStatus.AVAILABLE,
    )


class PricingRule(Base, TimestampMixin):
    """Date-ranged price adjustment applied on top of a unit type's base price."""

    __tablename__ = "pricing_rules"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_pricing_rules_date_range"),
        CheckConstraint(
            "amount IS NOT NULL OR percentage IS NOT NULL",
            name="ck_pricing_rules_has_adjustment",
        ),
    )

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
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    rule_type: Mapped[PricingRuleType] = mapped_column(
        Enum(
            PricingRuleType,
            name="pricing_rule_type",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    percentage: Mapped[Decimal | None] = mapped_column(Numeric(7, 2))
