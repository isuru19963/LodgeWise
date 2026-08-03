"""Redis / arq connection helpers."""

from arq.connections import RedisSettings, create_pool
from arq.connections import ArqRedis

from app.config import get_settings


def redis_settings() -> RedisSettings:
    """Parse REDIS_URL into arq RedisSettings."""
    return RedisSettings.from_dsn(get_settings().redis_url)


async def create_redis_pool() -> ArqRedis:
    """Create an arq Redis pool (used by producers enqueueing jobs)."""
    return await create_pool(redis_settings())
