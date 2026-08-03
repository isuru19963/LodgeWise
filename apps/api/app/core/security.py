"""Security primitives: password hashing and JWT issuance/verification.

All cryptography flows through this module — no other module imports `jwt`,
`pwdlib`, `secrets`, or `hmac` directly.
"""

import hmac
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings

TokenType = Literal["access", "refresh"]

# Argon2id — the recommended default (see docs/ARCHITECTURE_DECISIONS.md § 7).
_password_hasher = PasswordHash.recommended()


class TokenError(Exception):
    """Raised when a JWT is invalid, expired, or of the wrong type."""


# --- Passwords ---------------------------------------------------------------


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _password_hasher.verify(password, password_hash)


# --- JWT ----------------------------------------------------------------------


def _create_token(
    *,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
    token_type: TokenType,
    ttl_seconds: int,
) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    claims = {
        "sub": str(user_id),
        "org": str(organization_id),
        "type": token_type,
        "iat": now,
        "exp": now + timedelta(seconds=ttl_seconds),
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(claims, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: uuid.UUID, organization_id: uuid.UUID) -> str:
    return _create_token(
        user_id=user_id,
        organization_id=organization_id,
        token_type="access",
        ttl_seconds=get_settings().jwt_access_token_ttl_seconds,
    )


def create_refresh_token(user_id: uuid.UUID, organization_id: uuid.UUID) -> str:
    return _create_token(
        user_id=user_id,
        organization_id=organization_id,
        token_type="refresh",
        ttl_seconds=get_settings().jwt_refresh_token_ttl_seconds,
    )


def decode_token(token: str, *, expected_type: TokenType) -> dict[str, Any]:
    """Decode and validate a token, enforcing its type. Raises TokenError."""
    settings = get_settings()
    try:
        claims: dict[str, Any] = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["sub", "org", "type", "exp", "iat"]},
        )
    except jwt.PyJWTError as exc:
        raise TokenError("Invalid or expired token") from exc

    if claims["type"] != expected_type:
        raise TokenError(f"Expected {expected_type} token")
    return claims


# --- Generic helpers ----------------------------------------------------------


def generate_token(nbytes: int = 32) -> str:
    """Return a URL-safe, cryptographically random token."""
    return secrets.token_urlsafe(nbytes)


def constant_time_compare(left: str, right: str) -> bool:
    """Compare two strings without leaking timing information."""
    return hmac.compare_digest(left.encode(), right.encode())
