# backend/app/utils/rate_limit.py
import redis.asyncio as redis
from fastapi import Request

from app.config import get_settings
from app.utils.trusted_ip import get_client_ip, get_trusted_proxy_count


async def get_client_identifier(request: Request) -> str:
    settings = get_settings()
    return get_client_ip(request, get_trusted_proxy_count(settings))


async def check_rate_limit(
    redis_client: redis.Redis, identifier: str, key_suffix: str, limit: int, window_seconds: int,
) -> tuple[bool, int, int]:
    key = f"rl:{key_suffix}:{identifier}"
    current = await redis_client.incr(key)
    if current == 1:
        await redis_client.expire(key, window_seconds)
    ttl = await redis_client.ttl(key)
    return current <= limit, current, max(ttl, 0)


def add_rate_limit_headers(response, limit: int, current: int) -> None:
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(max(0, limit - current))