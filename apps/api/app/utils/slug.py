import re
import secrets

_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def slugify(value: str, *, max_length: int = 90) -> str:
    """Convert a display name into a URL-safe slug."""
    slug = _NON_ALNUM.sub("-", value.lower()).strip("-")
    return slug[:max_length] or f"org-{secrets.token_hex(4)}"


def slug_with_suffix(slug: str) -> str:
    """Return the slug with a short random suffix for collision resolution."""
    return f"{slug}-{secrets.token_hex(3)}"
