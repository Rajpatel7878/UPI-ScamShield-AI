"""Centralized exception handlers so every error uses one JSON shape."""

import logging

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    """Register handlers for HTTP, validation and unexpected errors."""

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "detail": exc.detail,
                "path": request.url.path,
            },
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # Never echo submitted input back: validation errors for password or
        # token fields would otherwise expose the raw secret in the response.
        safe_errors = [
            {
                "loc": jsonable_encoder(error.get("loc", [])),
                "msg": error.get("msg", "Invalid value"),
                "type": error.get("type", "value_error"),
            }
            for error in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={
                "status": "error",
                "detail": "Request validation failed.",
                "errors": safe_errors,
                "path": request.url.path,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception(
            "Unhandled error while processing %s %s",
            request.method,
            request.url.path,
        )
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "detail": "Internal server error.",
                "path": request.url.path,
            },
        )
