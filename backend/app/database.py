# backend/app/database.py
import contextlib
import logging
import uuid
from datetime import datetime
from typing import AsyncGenerator

import redis.asyncio as aioredis
from sqlalchemy import DateTime, MetaData, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

logger = logging.getLogger("weatherly")


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)


class TimestampMixin:
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class DatabaseManager:
    _engine: AsyncEngine | None = None
    _session_factory: async_sessionmaker[AsyncSession] | None = None

    @classmethod
    async def initialize(
        cls, database_url: str, pool_size: int, max_overflow: int,
        pool_timeout: int, pool_recycle: int, echo: bool,
    ) -> None:
        cls._engine = create_async_engine(
            database_url, pool_size=pool_size, max_overflow=max_overflow,
            pool_timeout=pool_timeout, pool_recycle=pool_recycle, echo=echo,
            pool_pre_ping=True, future=True,
        )
        cls._session_factory = async_sessionmaker(bind=cls._engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)

    @classmethod
    async def close(cls) -> None:
        if cls._engine:
            await cls._engine.dispose()
            cls._engine = None
            cls._session_factory = None

    @classmethod
    @contextlib.asynccontextmanager
    async def session(cls) -> AsyncGenerator[AsyncSession, None]:
        if cls._session_factory is None:
            raise RuntimeError("DatabaseManager is not initialized")
        session: AsyncSession = cls._session_factory()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    @classmethod
    def get_engine(cls) -> AsyncEngine:
        if cls._engine is None:
            raise RuntimeError("DatabaseManager is not initialized")
        return cls._engine

    @classmethod
    async def create_tables(cls) -> None:
        if cls._engine is None:
            raise RuntimeError("DatabaseManager is not initialized")
        async with cls._engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")


class RedisManager:
    _client: aioredis.Redis | None = None

    @classmethod
    async def initialize(cls, redis_url: str, max_connections: int) -> None:
        cls._client = aioredis.from_url(
            redis_url, encoding="utf-8", decode_responses=True,
            max_connections=max_connections, socket_connect_timeout=5, retry_on_timeout=True,
        )
        await cls._client.ping()

    @classmethod
    async def close(cls) -> None:
        if cls._client:
            await cls._client.aclose()
            cls._client = None

    @classmethod
    def get_client(cls) -> aioredis.Redis:
        if cls._client is None:
            raise RuntimeError("RedisManager is not initialized")
        return cls._client

    @classmethod
    async def health_check(cls) -> bool:
        try:
            if cls._client:
                return await cls._client.ping()
        except Exception:
            pass
        return False