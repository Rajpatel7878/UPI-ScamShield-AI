"""Application-wide configuration derived from environment variables."""

from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded from environment variables and an optional `.env` file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "UPI ScamShield AI"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True
    # Interactive /docs, /redoc and the OpenAPI schema. Set false to hide them.
    enable_docs: bool = True
    # "text" for local development, "json" for structured hosting logs.
    log_format: str = "text"
    log_level: str = "INFO"
    api_prefix: str = "/api/v1"
    frontend_url: str = "http://localhost:3000"

    # Comma-separated additional browser origins, e.g.
    # CORS_ORIGINS=https://app.example.com,https://staging.example.com
    cors_origins_raw: str = Field(
        default="",
        validation_alias=AliasChoices("CORS_ORIGINS", "CORS_EXTRA_ORIGINS"),
    )

    # Authentication. A strong secret is mandatory in production; see
    # app.core.security for startup validation.
    jwt_secret_key: str = Field(
        default="",
        validation_alias=AliasChoices("JWT_SECRET_KEY", "SECRET_KEY"),
    )
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=30,
        validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES",
        ge=5,
        le=1440,
    )

    # Android device credentials. A device token is issued per installation and
    # is separate from the user JWT; only its SHA-256 hash is stored. Expiry is
    # configurable and every token can be revoked individually.
    device_token_expire_days: int = Field(
        default=90,
        validation_alias="DEVICE_TOKEN_EXPIRE_DAYS",
        ge=1,
        le=3650,
    )
    max_active_devices_per_user: int = Field(
        default=5,
        validation_alias="MAX_ACTIVE_DEVICES_PER_USER",
        ge=1,
        le=100,
    )

    # Abuse protection (single-process, in-memory sliding windows). Documented
    # in README; replace with a shared store when running multiple workers.
    rate_limit_login_per_minute: int = 10
    rate_limit_register_per_5_minutes: int = 5
    rate_limit_analyze_per_minute: int = 30
    rate_limit_api_per_minute: int = 300
    trust_proxy_headers: bool = False
    max_request_bytes: int = 1_048_576
    openrouter_api_key: str = Field(default="", validation_alias="OPENROUTER_API_KEY")
    openrouter_base_url: str = Field(default="https://openrouter.ai/api/v1", validation_alias="OPENROUTER_BASE_URL")
    openrouter_model: str = Field(default="google/gemini-3.5-flash", validation_alias="OPENROUTER_MODEL")
    openrouter_timeout_seconds: float = Field(default=30, validation_alias="OPENROUTER_TIMEOUT_SECONDS")
    openrouter_max_retries: int = Field(default=2, validation_alias="OPENROUTER_MAX_RETRIES")

    @property
    def is_production(self) -> bool:
        """Whether the app is running with production safeguards."""
        return self.environment.strip().lower() in {"production", "prod"}

    @property
    def cors_origins(self) -> list[str]:
        """Origins allowed to call this API from a browser."""
        origins = [self.frontend_url.rstrip("/")]
        if not self.is_production:
            # The Next.js dev server runs on 3000; the previous Vite app used
            # 5173, which is kept so both can run during the transition.
            origins.extend(["http://localhost:3000", "http://localhost:5173"])
        origins.extend(
            origin.strip().rstrip("/")
            for origin in self.cors_origins_raw.split(",")
            if origin.strip()
        )
        # Preserve order while removing duplicates and wildcards.
        seen: set[str] = set()
        allowed: list[str] = []
        for origin in origins:
            if not origin or origin == "*" or origin in seen:
                continue
            seen.add(origin)
            allowed.append(origin)
        return allowed

    @property
    def api_v1_prefix(self) -> str:
        """Versioned API prefix."""
        return self.api_prefix.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance for the lifetime of the process."""
    return Settings()
