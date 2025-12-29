"""Application configuration using pydantic-settings."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="FieldOps AI API")
    app_version: str = Field(default="0.1.0")
    debug: bool = Field(default=False)
    environment: Literal["development", "staging", "production"] = Field(
        default="development"
    )

    # Server
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)

    # Database
    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/fieldops"
    )

    @property
    def async_database_url(self) -> str:
        """Convert postgres:// to postgresql+asyncpg:// for async support."""
        url = str(self.database_url)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # Security
    secret_key: str = Field(
        default="change-me-in-production-use-openssl-rand-hex-32"
    )
    api_key_header: str = Field(default="X-API-Key")

    # CORS
    cors_origins: list[str] = Field(default=["http://localhost:3000"])

    # External Services (to be configured)
    twilio_account_sid: str | None = Field(default=None)
    twilio_auth_token: str | None = Field(default=None)
    twilio_phone_number: str | None = Field(default=None)

    openai_api_key: str | None = Field(default=None)
    anthropic_api_key: str | None = Field(default=None)
    google_api_key: str | None = Field(default=None)

    qdrant_url: str | None = Field(default=None)
    qdrant_api_key: str | None = Field(default=None)

    stripe_secret_key: str | None = Field(default=None)
    stripe_webhook_secret: str | None = Field(default=None)

    # Supabase Storage
    supabase_url: str | None = Field(default=None)
    supabase_key: str | None = Field(default=None)


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()
