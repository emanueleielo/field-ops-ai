"""LLM factory service with fallback chain support."""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any

from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    """Supported LLM providers."""

    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GOOGLE = "google"


@dataclass
class LLMModel:
    """LLM model configuration."""

    provider: LLMProvider
    model_id: str
    display_name: str
    cost_per_million_input: float  # USD
    cost_per_million_output: float  # USD


# Model configurations with costs (USD per million tokens)
CLAUDE_HAIKU = LLMModel(
    provider=LLMProvider.ANTHROPIC,
    model_id="claude-3-5-haiku-latest",
    display_name="haiku",
    cost_per_million_input=0.25,
    cost_per_million_output=1.25,
)

GPT_4O_MINI = LLMModel(
    provider=LLMProvider.OPENAI,
    model_id="gpt-4o-mini",
    display_name="gpt4o-mini",
    cost_per_million_input=0.15,
    cost_per_million_output=0.60,
)

GEMINI_FLASH = LLMModel(
    provider=LLMProvider.GOOGLE,
    model_id="gemini-2.0-flash-exp",
    display_name="gemini-flash",
    cost_per_million_input=0.075,
    cost_per_million_output=0.30,
)

# Fallback order: Claude Haiku -> GPT-4o-mini -> Gemini Flash
FALLBACK_ORDER = [CLAUDE_HAIKU, GPT_4O_MINI, GEMINI_FLASH]


@dataclass
class LLMResult:
    """Result from LLM invocation with metadata."""

    llm: Any  # The LLM instance
    model: LLMModel
    fallback_used: bool
    fallback_reason: str | None = None


class LLMServiceError(Exception):
    """Exception raised when no LLM is available."""


class LLMService:
    """Service for creating LLM instances with fallback chain."""

    def __init__(self) -> None:
        """Initialize the LLM service."""
        self._settings = get_settings()

    def _is_provider_configured(self, provider: LLMProvider) -> bool:
        """Check if a provider has API key configured.

        Args:
            provider: The LLM provider to check.

        Returns:
            True if the provider is configured, False otherwise.
        """
        if provider == LLMProvider.ANTHROPIC:
            return bool(self._settings.anthropic_api_key)
        if provider == LLMProvider.OPENAI:
            return bool(self._settings.openai_api_key)
        if provider == LLMProvider.GOOGLE:
            return bool(self._settings.google_api_key)
        return False

    def _create_llm(self, model: LLMModel) -> Any:
        """Create an LLM instance for the given model.

        Args:
            model: The model configuration.

        Returns:
            A LangChain chat model instance.

        Raises:
            ValueError: If the provider is not configured.
        """
        if model.provider == LLMProvider.ANTHROPIC:
            if not self._settings.anthropic_api_key:
                raise ValueError("ANTHROPIC_API_KEY is not configured")
            return ChatAnthropic(
                model=model.model_id,
                api_key=self._settings.anthropic_api_key,
                temperature=0,
                max_tokens=1024,
            )

        if model.provider == LLMProvider.OPENAI:
            if not self._settings.openai_api_key:
                raise ValueError("OPENAI_API_KEY is not configured")
            return ChatOpenAI(
                model=model.model_id,
                api_key=self._settings.openai_api_key,
                temperature=0,
                max_tokens=1024,
            )

        if model.provider == LLMProvider.GOOGLE:
            if not self._settings.google_api_key:
                raise ValueError("GOOGLE_API_KEY is not configured")
            return ChatGoogleGenerativeAI(
                model=model.model_id,
                google_api_key=self._settings.google_api_key,
                temperature=0,
                max_output_tokens=1024,
            )

        raise ValueError(f"Unknown provider: {model.provider}")

    def get_llm(self) -> LLMResult:
        """Get an LLM instance using fallback chain.

        Tries Claude Haiku first, then GPT-4o-mini, then Gemini Flash.

        Returns:
            LLMResult with the LLM instance and metadata.

        Raises:
            LLMServiceError: If no LLM provider is available.
        """
        primary_model = FALLBACK_ORDER[0]
        fallback_reason: str | None = None

        for i, model in enumerate(FALLBACK_ORDER):
            if not self._is_provider_configured(model.provider):
                if i == 0:
                    fallback_reason = f"{model.display_name} not configured"
                logger.warning(
                    "Skipping %s: API key not configured",
                    model.display_name,
                )
                continue

            try:
                llm = self._create_llm(model)
                is_fallback = i > 0

                if is_fallback:
                    logger.info(
                        "Using fallback LLM: %s (reason: %s)",
                        model.display_name,
                        fallback_reason or "primary unavailable",
                    )
                else:
                    logger.info("Using primary LLM: %s", model.display_name)

                return LLMResult(
                    llm=llm,
                    model=model,
                    fallback_used=is_fallback,
                    fallback_reason=fallback_reason if is_fallback else None,
                )

            except Exception as e:
                fallback_reason = f"{model.display_name} error: {e!s}"
                logger.warning(
                    "Failed to create LLM for %s: %s",
                    model.display_name,
                    e,
                )
                continue

        raise LLMServiceError(
            "No LLM provider available. Configure at least one of: "
            "ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY"
        )

    def get_specific_llm(self, model: LLMModel) -> LLMResult:
        """Get a specific LLM instance without fallback.

        Args:
            model: The model to use.

        Returns:
            LLMResult with the LLM instance and metadata.

        Raises:
            ValueError: If the model is not configured.
        """
        llm = self._create_llm(model)
        return LLMResult(
            llm=llm,
            model=model,
            fallback_used=False,
        )


def calculate_cost_euro(
    tokens_input: int,
    tokens_output: int,
    model: LLMModel,
) -> float:
    """Calculate cost in EUR for a query.

    Args:
        tokens_input: Number of input tokens.
        tokens_output: Number of output tokens.
        model: The model used.

    Returns:
        Cost in EUR (assuming 1 USD = 0.92 EUR).
    """
    usd_to_eur = 0.92  # Approximate conversion rate
    input_cost = (tokens_input / 1_000_000) * model.cost_per_million_input
    output_cost = (tokens_output / 1_000_000) * model.cost_per_million_output
    total_usd = input_cost + output_cost
    return total_usd * usd_to_eur
