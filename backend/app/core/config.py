"""Application configuration management using pydantic-settings.

Loads environment variables with fallback defaults.
Phase 2 Scope: Added DATABASE_URL for persistent relational & time-series storage.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Core application settings."""

    APP_NAME: str = "Integrated Mine Safety Monitoring System Backend"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    # Database connection URL
    # Supports PostgreSQL (postgresql+psycopg://...) or SQLite (sqlite+aiosqlite:///...)
    DATABASE_URL: str = "sqlite+aiosqlite:///./mine_safety.db"

    # --- Phase 5: Live Monitoring (WebSocket) ---
    # 🔵 DECISION D-022: Server-initiated keepalive ping interval in seconds.
    # This is an implementation configuration, NOT a safety requirement.
    WS_KEEPALIVE_INTERVAL_S: int = 30
    # 🔵 DECISION D-021: Per-client asyncio.Queue max size for backpressure.
    # If full, the newest event is dropped for that client only.
    # Historical persistence is never affected by this limit.
    WS_MAX_QUEUE_SIZE: int = 50

    # --- Phase 6: Risk & Alert Engine ---
    # 🔵 DECISION D-027: Inactivity duration in seconds before a node is flagged UNRESPONSIVE.
    # Configurable prototype value; NOT an authoritative mine safety limit.
    NODE_UNRESPONSIVE_TIMEOUT_S: int = 60

    # --- Phase 7: AI / Anomaly Detection ---
    # 🔵 DECISION D-029 & D-030: Statistical anomaly baseline window and Z-score threshold.
    # Configurable prototype values; NOT authoritative mine engineering thresholds.
    AI_ANOMALY_ZSCORE_THRESHOLD: float = 3.0
    AI_BASELINE_WINDOW_SIZE: int = 30
    AI_MIN_SAMPLES_FOR_INFERENCE: int = 5

    # --- Phase 9: Security & Reliability Settings ---
    # 🔵 DECISION D-036: Configurable CORS allowed origins (default wildcard for dev prototype).
    CORS_ALLOWED_ORIGINS: list[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOWED_METHODS: list[str] = ["*"]
    CORS_ALLOWED_HEADERS: list[str] = ["*"]

    # 🔵 DECISION D-037: Input payload bounding guard (max readings per batch).
    MAX_TELEMETRY_READINGS_PER_REQUEST: int = 500

    # 🔵 DECISION D-038 & D-039: Database connection pool reliability.
    DB_POOL_PRE_PING: bool = True
    DB_POOL_RECYCLE_S: int = 1800

    # 🔵 DECISION D-040: Optional in-memory rate-limiting abuse protection.
    RATE_LIMIT_ENABLED: bool = False
    RATE_LIMIT_PER_MINUTE: int = 600


    @property
    def sync_database_url(self) -> str:
        """Convert async driver URL to synchronous driver URL for Alembic migrations."""
        url = self.DATABASE_URL
        if url.startswith("sqlite+aiosqlite://"):
            return url.replace("sqlite+aiosqlite://", "sqlite://", 1)
        if url.startswith("postgresql+asyncpg://"):
            return url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
        return url

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton instance of application settings."""
    return Settings()
