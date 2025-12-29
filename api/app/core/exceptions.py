"""Custom exceptions and exception handlers following RFC 7807."""

from typing import Any

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


class AppException(Exception):
    """Base exception for application-specific errors."""

    def __init__(
        self,
        status_code: int,
        error_type: str,
        title: str,
        detail: str,
        instance: str | None = None,
        extra: dict[str, Any] | None = None,
    ) -> None:
        """Initialize the application exception.

        Args:
            status_code: HTTP status code.
            error_type: URI reference identifying the problem type.
            title: Short, human-readable summary of the problem type.
            detail: Human-readable explanation specific to this occurrence.
            instance: URI reference identifying this specific occurrence.
            extra: Additional fields to include in the response.
        """
        self.status_code = status_code
        self.error_type = error_type
        self.title = title
        self.detail = detail
        self.instance = instance
        self.extra = extra or {}
        super().__init__(detail)


class NotFoundException(AppException):
    """Resource not found exception."""

    def __init__(
        self,
        detail: str = "Resource not found",
        instance: str | None = None,
    ) -> None:
        """Initialize not found exception."""
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_type="https://api.fieldops.ai/errors/not-found",
            title="Not Found",
            detail=detail,
            instance=instance,
        )


class ValidationException(AppException):
    """Validation error exception."""

    def __init__(
        self,
        detail: str = "Validation error",
        errors: list[dict[str, Any]] | None = None,
        instance: str | None = None,
    ) -> None:
        """Initialize validation exception."""
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_type="https://api.fieldops.ai/errors/validation",
            title="Validation Error",
            detail=detail,
            instance=instance,
            extra={"errors": errors or []},
        )


class QuotaExceededException(AppException):
    """Quota exceeded exception."""

    def __init__(
        self,
        detail: str = "Token quota exceeded",
        instance: str | None = None,
    ) -> None:
        """Initialize quota exceeded exception."""
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_type="https://api.fieldops.ai/errors/quota-exceeded",
            title="Quota Exceeded",
            detail=detail,
            instance=instance,
        )


class RateLimitException(AppException):
    """Rate limit exceeded exception."""

    def __init__(
        self,
        detail: str = "Rate limit exceeded",
        retry_after: int | None = None,
        instance: str | None = None,
    ) -> None:
        """Initialize rate limit exception."""
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_type="https://api.fieldops.ai/errors/rate-limit",
            title="Rate Limit Exceeded",
            detail=detail,
            instance=instance,
            extra={"retry_after": retry_after} if retry_after else {},
        )


class ConflictException(AppException):
    """Conflict exception for duplicate resources."""

    def __init__(
        self,
        detail: str = "Resource already exists",
        instance: str | None = None,
    ) -> None:
        """Initialize conflict exception."""
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            error_type="https://api.fieldops.ai/errors/conflict",
            title="Conflict",
            detail=detail,
            instance=instance,
        )


class ForbiddenException(AppException):
    """Forbidden exception for access denied."""

    def __init__(
        self,
        detail: str = "Access denied",
        instance: str | None = None,
    ) -> None:
        """Initialize forbidden exception."""
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_type="https://api.fieldops.ai/errors/forbidden",
            title="Forbidden",
            detail=detail,
            instance=instance,
        )


async def app_exception_handler(
    _request: Request,
    exc: AppException,
) -> JSONResponse:
    """Handle application exceptions and return RFC 7807 compliant response.

    Args:
        _request: The incoming request (unused but required by FastAPI).
        exc: The application exception.

    Returns:
        JSONResponse with RFC 7807 problem details.
    """
    content: dict[str, Any] = {
        "type": exc.error_type,
        "title": exc.title,
        "status": exc.status_code,
        "detail": exc.detail,
    }

    if exc.instance:
        content["instance"] = exc.instance

    content.update(exc.extra)

    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        media_type="application/problem+json",
    )


async def http_exception_handler(
    _request: Request,
    exc: HTTPException,
) -> JSONResponse:
    """Handle HTTP exceptions and return RFC 7807 compliant response.

    Args:
        _request: The incoming request (unused but required by FastAPI).
        exc: The HTTP exception.

    Returns:
        JSONResponse with RFC 7807 problem details.
    """
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    title = exc.detail if isinstance(exc.detail, str) else "HTTP Error"
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": f"https://api.fieldops.ai/errors/http-{exc.status_code}",
            "title": title,
            "status": exc.status_code,
            "detail": detail,
        },
        media_type="application/problem+json",
    )
