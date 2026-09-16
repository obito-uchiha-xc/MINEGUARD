"""Application Entry Point.

SIH 2026 Integrated Mine Safety Monitoring System Backend.
Initializes FastAPI, registers CORS & security middleware, exception handlers,
API routers, and manages graceful startup and shutdown lifecycle.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response

from backend.app.api.router import api_router
from backend.app.core.config import get_settings
from backend.app.core.errors import register_exception_handlers
from backend.app.core.logging import get_logger, setup_logging
from backend.app.db.session import close_db_engine
from backend.app.services.broadcaster import telemetry_broadcaster

settings = get_settings()
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle events with graceful resource cleanup."""
    logger.info(f"Starting {settings.APP_NAME} in [{settings.APP_ENV}] mode...")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")

    # 1. Disconnect and release all live WebSocket client queues
    try:
        await telemetry_broadcaster.shutdown()
    except Exception as err:
        logger.warning(f"Error during broadcaster shutdown: {err}")

    # 2. Close and dispose database connection pool
    try:
        await close_db_engine()
    except Exception as err:
        logger.warning(f"Error during database engine shutdown: {err}")

    logger.info("Graceful shutdown completed successfully.")


def create_application() -> FastAPI:
    """Application factory for FastAPI instance."""
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        description=(
            "Backend API for SIH 2026 Integrated Mine Safety Monitoring System. "
            "Hardened for Security and Reliability."
        ),
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # 1. Security Headers Middleware (🔵 D-036)
    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # 2. CORS Middleware (🔵 D-036)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ALLOWED_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOWED_METHODS,
        allow_headers=settings.CORS_ALLOWED_HEADERS,
    )

    # 3. Register centralized exception handlers
    register_exception_handlers(app)

    # 4. Register API routers
    app.include_router(api_router)

    return app


app = create_application()
