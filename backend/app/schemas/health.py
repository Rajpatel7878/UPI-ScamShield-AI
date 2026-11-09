"""Pydantic response schemas."""

from pydantic import BaseModel, Field


class RootResponse(BaseModel):
    """Metadata returned by the API root endpoint."""

    status: str = Field(examples=["ok"])
    service: str = Field(examples=["UPI ScamShield AI API"])
    version: str = Field(examples=["0.1.0"])


class HealthResponse(BaseModel):
    """Service health payload.

    ``database`` reports ``not_configured`` until persistence is added in a
    later phase; it must never claim a connection that does not exist.
    """

    status: str = Field(examples=["healthy"])
    database: str = Field(examples=["not_configured"])
    service: str = Field(examples=["UPI ScamShield AI"])
