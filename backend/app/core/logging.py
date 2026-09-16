"""Centralized application logging configuration.

Provides structured formatting and level control across the application.
"""

import logging
import sys
import re
from typing import Optional
from backend.app.core.config import get_settings

settings = get_settings()

_CREDENTIAL_PATTERN = re.compile(r"://([^:]+):([^@]+)@")


def mask_sensitive_url(url: Optional[str]) -> str:
    """Mask credentials in database URLs or connection strings to avoid log leakage."""
    if not url:
        return ""
    return _CREDENTIAL_PATTERN.sub(r"://\1:***@", url)


def setup_logging() -> None:
    """Configure root and application loggers."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    log_format = (
        "[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s"
    )

    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Set external libraries to warning to keep startup logs clean
    logging.getLogger("uvicorn.access").setLevel(log_level)


def get_logger(name: str) -> logging.Logger:
    """Return a logger instance with the standard configuration."""
    return logging.getLogger(name)
