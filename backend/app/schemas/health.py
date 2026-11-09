"""Pydantic response schemas."""

from pydantic import BaseModel, Field


class RootResponse(BaseModel):
    """Metadata returned by the API root endpoint."""

    status: str = Field(examples=["running"])
    service: str = Field(examples=["UPI ScamShield AI"])
    version: str = Field(examples=["1.0.0"])


class HealthResponse(BaseModel):
    """Service health payload.

    ``database`` reports ``not_configured`` until persistence is added in a
    later phase; it must never claim a connection that does not exist.
    """

    status: str = Field(examples=["healthy"])
    database: str = Field(examples=["not_configured"])
    service: str = Field(examples=["UPI ScamShield AI"])
    environment: str = Field(examples=["development"])


class SystemInfoResponse(BaseModel):
    """Safe application metadata returned by the system info endpoint.

    Never exposes API keys, secret environment variables, or internal system details.
    """

    app_name: str
    app_version: str
    environment: str
    api_prefix: str
    available_modules: list[str]
    database_integration: str
    ai_integration: str


# Alias for backward compatibility / docs clarity
HealthResponse.model_rebuild()
RootResponse.model_rebuild()