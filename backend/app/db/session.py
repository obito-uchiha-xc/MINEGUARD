"""Database Engine and Session Management.

Provides asynchronous SQLAlchemy 2.0 session factory and FastAPI dependency.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from backend.app.core.config import get_settings
from backend.app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

# Engine creation with connection pooling / SQLite thread-safe configuration
engine_kwargs = {
    "echo": False,
    "pool_pre_ping": settings.DB_POOL_PRE_PING,
}
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite requires check_same_thread=False
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_recycle"] = settings.DB_POOL_RECYCLE_S

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing an isolated database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def close_db_engine() -> None:
    """Gracefully dispose the database engine and close all connections."""
    logger.info("Closing database engine and pooled connections...")
    await engine.dispose()
    logger.info("Database engine connections successfully closed.")
