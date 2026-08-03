import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid6 import uuid7

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class UserRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"


# Higher number = more privileges. Used for "at least this role" checks.
_ROLE_RANK: dict[UserRole, int] = {
    UserRole.STAFF: 0,
    UserRole.MANAGER: 1,
    UserRole.ADMIN: 2,
    UserRole.OWNER: 3,
}


class User(Base, TimestampMixin):
    """A platform user. Every user belongs to exactly one organization."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=UserRole.STAFF,
    )

    organization: Mapped["Organization"] = relationship(back_populates="users")

    def has_at_least(self, role: UserRole) -> bool:
        return _ROLE_RANK[self.role] >= _ROLE_RANK[role]

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"
