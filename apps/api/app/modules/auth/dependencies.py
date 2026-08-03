"""Authentication and tenant-context dependencies.

Every protected route depends (directly or indirectly) on these. The tenant
context is resolved from the verified JWT — never from client-supplied
headers or parameters.
"""

import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import TokenError, decode_token
from app.database.session import get_db
from app.models import User, UserRole

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if credentials is None:
        raise UnauthorizedError("Not authenticated")

    try:
        claims = decode_token(credentials.credentials, expected_type="access")
    except TokenError as exc:
        raise UnauthorizedError(str(exc)) from exc

    user = await session.get(User, uuid.UUID(claims["sub"]))
    if user is None or str(user.organization_id) != claims["org"]:
        raise UnauthorizedError("User no longer exists")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


@dataclass(frozen=True)
class TenantContext:
    """The resolved tenant for this request. Required by every tenant-scoped query."""

    organization_id: uuid.UUID
    user_id: uuid.UUID
    role: UserRole


async def get_tenant_context(user: CurrentUser) -> TenantContext:
    return TenantContext(
        organization_id=user.organization_id,
        user_id=user.id,
        role=user.role,
    )


CurrentTenant = Annotated[TenantContext, Depends(get_tenant_context)]


async def get_tenant_db(
    tenant: CurrentTenant,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AsyncSession:
    """Request-scoped session with the tenant applied as a Postgres setting.

    `app.tenant_id` is what the Row-Level Security policies will compare
    against (see docs/DATABASE_DESIGN.md § 1). Policies land together with the
    first tenant-owned domain tables; setting the context now means every
    query path is already RLS-ready.
    """
    await session.execute(
        text("SELECT set_config('app.tenant_id', :tenant_id, false)"),
        {"tenant_id": str(tenant.organization_id)},
    )
    return session


TenantDB = Annotated[AsyncSession, Depends(get_tenant_db)]


def require_role(minimum: UserRole):  # noqa: ANN201 - FastAPI dependency factory
    """Dependency factory: allow only users with at least `minimum` role."""

    async def _check(user: CurrentUser) -> User:
        if not user.has_at_least(minimum):
            raise ForbiddenError(f"Requires {minimum.value} role or higher")
        return user

    return Depends(_check)
