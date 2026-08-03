# SQLAlchemy models. Every model must be imported here so Alembic
# autogenerate sees the full metadata.

from app.models.organization import Organization
from app.models.user import User, UserRole
from app.modules.availability.models import (
    AvailabilityStatus,
    PricingRule,
    PricingRuleType,
    UnitAvailability,
)
from app.modules.billing.models import (
    Invoice,
    InvoiceStatus,
    Plan,
    Subscription,
    SubscriptionStatus,
)
from app.modules.bookings.models import (
    Booking,
    BookingItem,
    BookingStatus,
    PaymentStatus,
)
from app.modules.guests.models import Guest, IdentificationType
from app.modules.properties.models import (
    Property,
    PropertyType,
    Unit,
    UnitStatus,
    UnitType,
)

__all__ = [
    "AvailabilityStatus",
    "Booking",
    "BookingItem",
    "BookingStatus",
    "Guest",
    "IdentificationType",
    "Invoice",
    "InvoiceStatus",
    "Organization",
    "PaymentStatus",
    "Plan",
    "PricingRule",
    "PricingRuleType",
    "Property",
    "PropertyType",
    "Subscription",
    "SubscriptionStatus",
    "Unit",
    "UnitAvailability",
    "UnitStatus",
    "UnitType",
    "User",
    "UserRole",
]
