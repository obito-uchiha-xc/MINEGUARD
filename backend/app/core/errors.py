"""Centralized error handling and standard error responses.

Establishes a predictable error envelope across all API endpoints:
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable description",
        "details": null
    }
}
"""

from typing import Any, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from backend.app.core.logging import get_logger

logger = get_logger(__name__)


class AppException(Exception):
    """Base application exception for managed errors."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Any] = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


def create_error_response(
    code: str,
    message: str,
    status_code: int,
    details: Optional[Any] = None,
) -> JSONResponse:
    """Build a standardized JSON error response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details,
            }
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register centralized exception handlers on the FastAPI application."""

    @app.exception_handler(AppException)
    async def app_exception_handler(
        request: Request, exc: AppException
    ) -> JSONResponse:
        logger.warning(f"AppException: [{exc.code}] {exc.message} on {request.url.path}")
        return create_error_response(
            code=exc.code,
            message=exc.message,
            status_code=exc.status_code,
            details=exc.details,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        logger.warning(f"HTTPException {exc.status_code}: {exc.detail} on {request.url.path}")
        code = "NOT_FOUND" if exc.status_code == status.HTTP_404_NOT_FOUND else "HTTP_ERROR"
        return create_error_response(
            code=code,
            message=str(exc.detail),
            status_code=exc.status_code,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
        return create_error_response(
            code="VALIDATION_ERROR",
            message="Request validation failed.",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=exc.errors(),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
        return create_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected internal server error occurred.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
