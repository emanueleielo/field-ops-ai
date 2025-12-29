"""Embedding service using OpenAI."""

from openai import AsyncOpenAI

from app.config import get_settings


class EmbeddingService:
    """Service for generating text embeddings using OpenAI."""

    MODEL = "text-embedding-3-small"
    DIMENSIONS = 1536

    def __init__(self) -> None:
        """Initialize the embedding service with OpenAI client."""
        settings = get_settings()
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured")
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def embed_text(self, text: str) -> list[float]:
        """Generate embedding for a single text.

        Args:
            text: The text to embed.

        Returns:
            A list of floats representing the embedding vector (1536 dimensions).

        Raises:
            openai.APIError: If the API request fails.
        """
        response = await self.client.embeddings.create(
            model=self.MODEL,
            input=text,
        )
        return response.data[0].embedding

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts.

        Args:
            texts: A list of texts to embed.

        Returns:
            A list of embedding vectors, one for each input text.

        Raises:
            openai.APIError: If the API request fails.
        """
        if not texts:
            return []

        response = await self.client.embeddings.create(
            model=self.MODEL,
            input=texts,
        )
        return [item.embedding for item in response.data]
