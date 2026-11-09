"""Application-wide configuration derived from environment variables."""

from functools import lru_cache

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
    app_version: str = "0.1.0"
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        """Origins allowed to call this API from a browser."""
        return [self.frontend_url.rstrip("/")]


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance for the lifetime of the process."""
    return Settings()
