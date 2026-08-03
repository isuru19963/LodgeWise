import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import Organization, User, UserRole
from app.modules.auth.schemas import RegisterRequest, TokenPair
from app.utils.slug import slug_with_suffix, slugify


def _token_pair(user: User) -> TokenPair:
    return TokenPair(
        access_token=create_access_token(user.id, user.organization_id),
        refresh_token=create_refresh_token(user.id, user.organization_id),
        expires_in=get_settings().jwt_access_token_ttl_seconds,
    )


async def register(session: AsyncSession, data: RegisterRequest) -> tuple[User, TokenPair]:
    """Create a new organization with its OWNER user and issue tokens."""
    email = data.email.lower()
    existing = await session.scalar(select(User.id).where(User.email == email))
    if existing is not None:
        raise ConflictError("An account with this email already exists")

    slug = slugify(data.organization_name)
    if await session.scalar(select(Organization.id).where(Organization.slug == slug)):
        slug = slug_with_suffix(slug)

    organization = Organization(name=data.organization_name, slug=slug)
    session.add(organization)
    await session.flush()  # assign organization.id before creating the user

    user = User(
        organization_id=organization.id,
        email=email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        role=UserRole.OWNER,
    )
    session.add(user)
    await session.flush()

    from app.modules.billing.service import start_free_trial

    await start_free_trial(session, organization.id)

    await session.commit()
    await session.refresh(user)

    return user, _token_pair(user)


async def login(session: AsyncSession, email: str, password: str) -> tuple[User, TokenPair]:
    user = await session.scalar(select(User).where(User.email == email.lower()))
    # Verify against a dummy hash when the user is unknown so response timing
    # does not reveal whether an email is registered.
    if user is None:
        verify_password(password, hash_password("invalid-dummy-password"))
        raise UnauthorizedError("Invalid email or password")
    if not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid email or password")

    return user, _token_pair(user)


async def refresh(session: AsyncSession, refresh_token: str) -> TokenPair:
    """Rotate a refresh token into a new token pair.

    Stateless rotation: tokens are not stored server-side yet. A denylist /
    session store (Redis) is planned before production hardening.
    """
    try:
        claims = decode_token(refresh_token, expected_type="refresh")
    except TokenError as exc:
        raise UnauthorizedError(str(exc)) from exc

    user = await session.get(User, uuid.UUID(claims["sub"]))
    if user is None or str(user.organization_id) != claims["org"]:
        raise UnauthorizedError("Invalid refresh token")

    return _token_pair(user)
