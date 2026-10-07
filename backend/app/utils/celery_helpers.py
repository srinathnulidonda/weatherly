# backend/app/utils/celery_helpers.py
import asyncio
from functools import wraps

from app.config import get_settings
from app.database import DatabaseManager, RedisManager

def with_services(service_cls=None, use_db=True, use_redis=True):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            async def runner():
                settings = get_settings()
                if use_db:
                    await DatabaseManager.initialize(
                        settings.async_database_url, settings.DB_POOL_SIZE, settings.DB_MAX_OVERFLOW,
                        settings.DB_POOL_TIMEOUT, settings.DB_POOL_RECYCLE, settings.DB_ECHO,
                    )
                if use_redis:
                    await RedisManager.initialize(settings.REDIS_URL, settings.REDIS_MAX_CONNECTIONS)
                try:
                    if use_db:
                        async with DatabaseManager.session() as db:
                            service = service_cls(db) if service_cls else None
                            return await func(*args, db=db, service=service, **kwargs)
                    return await func(*args, db=None, service=None, **kwargs)
                finally:
                    if use_db:
                        await DatabaseManager.close()
                    if use_redis:
                        await RedisManager.close()
            return asyncio.run(runner())
        return wrapper
    return decorator