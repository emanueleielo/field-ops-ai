"""Initialize Qdrant collection.

Usage:
    cd api && uv run python scripts/init_qdrant.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.vector_store import VectorStoreError, VectorStoreService


async def main() -> None:
    """Initialize the Qdrant collection."""
    try:
        vs = VectorStoreService()
        await vs.init_collection()
        print("Qdrant collection initialized successfully!")
    except ValueError as e:
        print(f"Configuration error: {e}")
        sys.exit(1)
    except VectorStoreError as e:
        print(f"Vector store error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
