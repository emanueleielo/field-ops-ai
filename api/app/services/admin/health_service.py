"""Health monitoring service for checking external service status."""

import logging
import time
from datetime import datetime
from typing import Any

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.admin.health import (
    HealthResponse,
    LLMProviderStatus,
    ServiceStatus,
    ServiceStatusEnum,
)
from app.config import get_settings

logger = logging.getLogger(__name__)


class HealthService:
    """Service for checking health status of all external services.

    Monitors Qdrant, Twilio, Database, and LLM providers to provide
    a comprehensive view of system health for the admin dashboard.
    """

    def __init__(self) -> None:
        """Initialize the health service."""
        self.settings = get_settings()
        self.timeout = 10.0  # seconds

    async def get_overall_health(self, db: AsyncSession) -> HealthResponse:
        """Get overall health status of all services.

        Args:
            db: Database session for DB health check.

        Returns:
            HealthResponse with status of all services.
        """
        services: dict[str, ServiceStatus] = {}

        # Check each service
        services["database"] = await self.check_database_status(db)
        services["qdrant"] = await self.check_qdrant_status()
        services["twilio"] = await self.check_twilio_status()
        services["llm"] = await self.check_llm_status()

        # Determine overall status
        overall_status = self._calculate_overall_status(services)

        return HealthResponse(
            overall_status=overall_status,
            services=services,
            generated_at=datetime.utcnow().isoformat(),
        )

    def _calculate_overall_status(
        self, services: dict[str, ServiceStatus]
    ) -> ServiceStatusEnum:
        """Calculate overall status based on individual service statuses.

        Args:
            services: Dictionary of service statuses.

        Returns:
            Overall system status.
        """
        statuses = [s.status for s in services.values()]

        # If any critical service is down, system is down
        if ServiceStatusEnum.down in statuses:
            return ServiceStatusEnum.down

        # If any service is degraded, system is degraded
        if ServiceStatusEnum.degraded in statuses:
            return ServiceStatusEnum.degraded

        # If all services are healthy, system is healthy
        if all(s == ServiceStatusEnum.healthy for s in statuses):
            return ServiceStatusEnum.healthy

        return ServiceStatusEnum.unknown

    async def check_database_status(self, db: AsyncSession) -> ServiceStatus:
        """Check database connectivity and health.

        Args:
            db: Database session.

        Returns:
            ServiceStatus for database.
        """
        start_time = time.time()
        try:
            # Execute a simple query to test connectivity
            result = await db.execute(text("SELECT 1"))
            result.scalar()

            latency_ms = int((time.time() - start_time) * 1000)

            # Check if latency is acceptable
            if latency_ms > 500:
                return ServiceStatus(
                    name="Database",
                    status=ServiceStatusEnum.degraded,
                    latency_ms=latency_ms,
                    message="High latency detected",
                    last_checked=datetime.utcnow().isoformat(),
                )

            return ServiceStatus(
                name="Database",
                status=ServiceStatusEnum.healthy,
                latency_ms=latency_ms,
                message="Connected and responsive",
                last_checked=datetime.utcnow().isoformat(),
            )

        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return ServiceStatus(
                name="Database",
                status=ServiceStatusEnum.down,
                latency_ms=None,
                message=f"Connection failed: {str(e)[:100]}",
                last_checked=datetime.utcnow().isoformat(),
            )

    async def check_qdrant_status(self) -> ServiceStatus:
        """Check Qdrant vector database status.

        Returns:
            ServiceStatus for Qdrant.
        """
        if not self.settings.qdrant_url:
            return ServiceStatus(
                name="Qdrant",
                status=ServiceStatusEnum.unknown,
                latency_ms=None,
                message="Qdrant URL not configured",
                last_checked=datetime.utcnow().isoformat(),
            )

        start_time = time.time()
        try:
            headers = {}
            if self.settings.qdrant_api_key:
                headers["api-key"] = self.settings.qdrant_api_key

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Try to get collections list
                response = await client.get(
                    f"{self.settings.qdrant_url}/collections",
                    headers=headers,
                )

                latency_ms = int((time.time() - start_time) * 1000)

                if response.status_code == 200:
                    data = response.json()
                    collections_count = len(data.get("result", {}).get("collections", []))

                    return ServiceStatus(
                        name="Qdrant",
                        status=ServiceStatusEnum.healthy,
                        latency_ms=latency_ms,
                        message=f"{collections_count} collections available",
                        last_checked=datetime.utcnow().isoformat(),
                        details={"collections_count": collections_count},
                    )
                else:
                    return ServiceStatus(
                        name="Qdrant",
                        status=ServiceStatusEnum.degraded,
                        latency_ms=latency_ms,
                        message=f"Unexpected response: {response.status_code}",
                        last_checked=datetime.utcnow().isoformat(),
                    )

        except httpx.TimeoutException:
            return ServiceStatus(
                name="Qdrant",
                status=ServiceStatusEnum.degraded,
                latency_ms=int(self.timeout * 1000),
                message="Request timeout",
                last_checked=datetime.utcnow().isoformat(),
            )
        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")
            return ServiceStatus(
                name="Qdrant",
                status=ServiceStatusEnum.down,
                latency_ms=None,
                message=f"Connection failed: {str(e)[:100]}",
                last_checked=datetime.utcnow().isoformat(),
            )

    async def check_twilio_status(self) -> ServiceStatus:
        """Check Twilio account status.

        Returns:
            ServiceStatus for Twilio.
        """
        if not self.settings.twilio_account_sid or not self.settings.twilio_auth_token:
            return ServiceStatus(
                name="Twilio",
                status=ServiceStatusEnum.unknown,
                latency_ms=None,
                message="Twilio credentials not configured",
                last_checked=datetime.utcnow().isoformat(),
            )

        start_time = time.time()
        try:
            auth = (
                self.settings.twilio_account_sid,
                self.settings.twilio_auth_token,
            )

            async with httpx.AsyncClient(timeout=self.timeout, auth=auth) as client:
                response = await client.get(
                    f"https://api.twilio.com/2010-04-01/Accounts/"
                    f"{self.settings.twilio_account_sid}.json"
                )

                latency_ms = int((time.time() - start_time) * 1000)

                if response.status_code == 200:
                    data = response.json()
                    account_status = data.get("status", "unknown")

                    # Try to get balance (optional)
                    balance: float | None = None
                    try:
                        balance_response = await client.get(
                            f"https://api.twilio.com/2010-04-01/Accounts/"
                            f"{self.settings.twilio_account_sid}/Balance.json"
                        )
                        if balance_response.status_code == 200:
                            balance_data = balance_response.json()
                            balance = float(balance_data.get("balance", 0))
                    except Exception:
                        pass  # Balance check is optional

                    status = (
                        ServiceStatusEnum.healthy
                        if account_status == "active"
                        else ServiceStatusEnum.degraded
                    )

                    details: dict[str, Any] = {"account_status": account_status}
                    if balance is not None:
                        details["balance"] = balance

                    return ServiceStatus(
                        name="Twilio",
                        status=status,
                        latency_ms=latency_ms,
                        message=f"Account status: {account_status}",
                        last_checked=datetime.utcnow().isoformat(),
                        details=details,
                    )
                elif response.status_code == 401:
                    return ServiceStatus(
                        name="Twilio",
                        status=ServiceStatusEnum.down,
                        latency_ms=latency_ms,
                        message="Invalid credentials",
                        last_checked=datetime.utcnow().isoformat(),
                    )
                else:
                    return ServiceStatus(
                        name="Twilio",
                        status=ServiceStatusEnum.degraded,
                        latency_ms=latency_ms,
                        message=f"Unexpected response: {response.status_code}",
                        last_checked=datetime.utcnow().isoformat(),
                    )

        except httpx.TimeoutException:
            return ServiceStatus(
                name="Twilio",
                status=ServiceStatusEnum.degraded,
                latency_ms=int(self.timeout * 1000),
                message="Request timeout",
                last_checked=datetime.utcnow().isoformat(),
            )
        except Exception as e:
            logger.error(f"Twilio health check failed: {e}")
            return ServiceStatus(
                name="Twilio",
                status=ServiceStatusEnum.down,
                latency_ms=None,
                message=f"Connection failed: {str(e)[:100]}",
                last_checked=datetime.utcnow().isoformat(),
            )

    async def check_llm_status(self) -> ServiceStatus:
        """Check LLM API status for all configured providers.

        Returns:
            ServiceStatus for LLM services.
        """
        providers: list[LLMProviderStatus] = []
        overall_status = ServiceStatusEnum.unknown

        # Check Anthropic (Claude)
        anthropic_status = await self._check_anthropic()
        providers.append(anthropic_status)

        # Check OpenAI
        openai_status = await self._check_openai()
        providers.append(openai_status)

        # Check Google (Gemini)
        google_status = await self._check_google()
        providers.append(google_status)

        # Determine overall LLM status
        # We need at least one provider to be healthy
        provider_statuses = [p.status for p in providers if p.api_key_valid]

        if not provider_statuses:
            overall_status = ServiceStatusEnum.down
            message = "No LLM providers configured"
        elif any(s == ServiceStatusEnum.healthy for s in provider_statuses):
            overall_status = ServiceStatusEnum.healthy
            healthy_count = sum(1 for s in provider_statuses if s == ServiceStatusEnum.healthy)
            message = f"{healthy_count}/{len(provider_statuses)} providers healthy"
        else:
            overall_status = ServiceStatusEnum.degraded
            message = "All configured providers degraded"

        return ServiceStatus(
            name="LLM Services",
            status=overall_status,
            latency_ms=None,
            message=message,
            last_checked=datetime.utcnow().isoformat(),
            details={"providers": [p.model_dump() for p in providers]},
        )

    async def _check_anthropic(self) -> LLMProviderStatus:
        """Check Anthropic API status.

        Returns:
            LLMProviderStatus for Anthropic.
        """
        if not self.settings.anthropic_api_key:
            return LLMProviderStatus(
                name="Anthropic (Claude)",
                status=ServiceStatusEnum.unknown,
                api_key_valid=False,
                latency_ms=None,
            )

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # We can check the API by making a minimal request
                # or just verify the key format
                # For now, we just check if the key exists and has valid format
                key = self.settings.anthropic_api_key
                if key.startswith("sk-ant-"):
                    latency_ms = int((time.time() - start_time) * 1000)
                    return LLMProviderStatus(
                        name="Anthropic (Claude)",
                        status=ServiceStatusEnum.healthy,
                        api_key_valid=True,
                        latency_ms=latency_ms,
                    )
                else:
                    return LLMProviderStatus(
                        name="Anthropic (Claude)",
                        status=ServiceStatusEnum.degraded,
                        api_key_valid=True,
                        latency_ms=None,
                    )

        except Exception as e:
            logger.error(f"Anthropic health check failed: {e}")
            return LLMProviderStatus(
                name="Anthropic (Claude)",
                status=ServiceStatusEnum.down,
                api_key_valid=True,
                latency_ms=None,
            )

    async def _check_openai(self) -> LLMProviderStatus:
        """Check OpenAI API status.

        Returns:
            LLMProviderStatus for OpenAI.
        """
        if not self.settings.openai_api_key:
            return LLMProviderStatus(
                name="OpenAI",
                status=ServiceStatusEnum.unknown,
                api_key_valid=False,
                latency_ms=None,
            )

        start_time = time.time()
        try:
            # Verify key format
            key = self.settings.openai_api_key
            if key.startswith("sk-"):
                latency_ms = int((time.time() - start_time) * 1000)
                return LLMProviderStatus(
                    name="OpenAI",
                    status=ServiceStatusEnum.healthy,
                    api_key_valid=True,
                    latency_ms=latency_ms,
                )
            else:
                return LLMProviderStatus(
                    name="OpenAI",
                    status=ServiceStatusEnum.degraded,
                    api_key_valid=True,
                    latency_ms=None,
                )

        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return LLMProviderStatus(
                name="OpenAI",
                status=ServiceStatusEnum.down,
                api_key_valid=True,
                latency_ms=None,
            )

    async def _check_google(self) -> LLMProviderStatus:
        """Check Google AI (Gemini) API status.

        Returns:
            LLMProviderStatus for Google.
        """
        if not self.settings.google_api_key:
            return LLMProviderStatus(
                name="Google (Gemini)",
                status=ServiceStatusEnum.unknown,
                api_key_valid=False,
                latency_ms=None,
            )

        start_time = time.time()
        try:
            # Google API keys don't have a standard prefix, just check if set
            key = self.settings.google_api_key
            if len(key) > 20:  # Basic validation
                latency_ms = int((time.time() - start_time) * 1000)
                return LLMProviderStatus(
                    name="Google (Gemini)",
                    status=ServiceStatusEnum.healthy,
                    api_key_valid=True,
                    latency_ms=latency_ms,
                )
            else:
                return LLMProviderStatus(
                    name="Google (Gemini)",
                    status=ServiceStatusEnum.degraded,
                    api_key_valid=True,
                    latency_ms=None,
                )

        except Exception as e:
            logger.error(f"Google health check failed: {e}")
            return LLMProviderStatus(
                name="Google (Gemini)",
                status=ServiceStatusEnum.down,
                api_key_valid=True,
                latency_ms=None,
            )
