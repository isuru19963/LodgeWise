"""Security primitives.

Authentication (JWT issuance/verification, password hashing) is intentionally
not implemented yet — it arrives with the auth phase (see
docs/ARCHITECTURE_DECISIONS.md § 7). This module holds only auth-agnostic
helpers so that no other module ever reaches for `secrets`/`hmac` directly.
"""

import hmac
import secrets


def generate_token(nbytes: int = 32) -> str:
    """Return a URL-safe, cryptographically random token."""
    return secrets.token_urlsafe(nbytes)


def constant_time_compare(left: str, right: str) -> bool:
    """Compare two strings without leaking timing information."""
    return hmac.compare_digest(left.encode(), right.encode())
