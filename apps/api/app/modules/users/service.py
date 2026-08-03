from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError
from app.core.security import hash_password
from app.models import User, UserRole
from app.modules.auth.dependencies import TenantContext
from app.modules.users.schemas import UserCreate


async def list_users(session: AsyncSession, tenant: TenantContext) -> list[User]:
    result = await session.scalars(
        select(User)
        .where(User.organization_id == tenant.organization_id)
        .order_by(User.created_at)
    )
    return list(result)


async def create_user(session: AsyncSession, tenant: TenantContext, data: UserCreate) -> User:
    """Create a user inside the current tenant's organization."""
    from app.modules.billing.service import assert_can_add_user

    if data.role is UserRole.OWNER:
        raise ForbiddenError("An owner account cannot be created this way")
    if data.role is UserRole.ADMIN and tenant.role is not UserRole.OWNER:
        raise ForbiddenError("Only the owner can create admin accounts")

    await assert_can_add_user(session, tenant)

    email = data.email.lower()
    if await session.scalar(select(User.id).where(User.email == email)):
        raise ConflictError("An account with this email already exists")

    user = User(
        organization_id=tenant.organization_id,
        email=email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        role=data.role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
