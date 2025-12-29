"""Initialize the database with all tables.

Usage:
    uv run python scripts/init_db.py
"""

import asyncio

from app.db.base import Base
from app.db.session import get_async_engine

# Import all models to register them with Base.metadata
from app.models import (  # noqa: F401
    ActivityLog,
    ConversationState,
    Document,
    Message,
    Organization,
    PhoneNumber,
)


async def init_db() -> None:
    """Create all database tables."""
    engine = get_async_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("Database tables created successfully.")


if __name__ == "__main__":
    asyncio.run(init_db())
