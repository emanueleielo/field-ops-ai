"""Database session management."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings


def get_async_engine() -> AsyncEngine:
    """Create and return an async database engine.

    Returns:
        Configured async SQLAlchemy engine.
    """
    settings = get_settings()
    return create_async_engine(
        settings.async_database_url,
        echo=settings.debug,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


def get_async_session_factory() -> async_sessionmaker[AsyncSession]:
    """Create and return an async session factory.

    Returns:
        Configured async session factory.
    """
    engine = get_async_engine()
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


async def get_db() -> AsyncGenerator[AsyncSession]:
    """Dependency that provides a database session.

    Yields:
        An async database session.
    """
    session_factory = get_async_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
