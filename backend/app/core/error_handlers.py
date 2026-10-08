"""Map every failure to one consistent JSON error envelope."""

import logging
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.errors import AppError, ErrorCode

logger = logging.getLogger(__name__)

_HTTP_STATUS_TO_CODE: dict[int, ErrorCode] = {
    HTTPStatus.NOT_FOUND: ErrorCode.NOT_FOUND,
    HTTPStatus.METHOD_NOT_ALLOWED: ErrorCode.METHOD_NOT_ALLOWED,
}


def error_response(
    status_code: int, code: ErrorCode, message: str, details: list[dict[str, Any]] | None = None
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "details": details or []}},
    )


def _format_validation_errors(exc: RequestValidationError) -> list[dict[str, Any]]:
    details = []
    for error in exc.errors():
        # loc looks like ("body", "title") or ("path", "meeting_code").
        location = [
            str(part) for part in error.get("loc", ()) if part not in ("body", "query", "path")
        ]
        message = str(error.get("msg", "Invalid value")).removeprefix("Value error, ")
        details.append({"field": ".".join(location) or None, "message": message})
    return details


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return error_response(exc.status_code, exc.code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        # FastAPI's default is 422; we use 400 so all "bad input" responses share one status.
        details = _format_validation_errors(exc)
        message = details[0]["message"] if details else "Invalid request."
        return error_response(HTTPStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, message, details)

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = _HTTP_STATUS_TO_CODE.get(exc.status_code, ErrorCode.INTERNAL_ERROR)
        return error_response(exc.status_code, code, str(exc.detail))

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error", exc_info=exc)
        return error_response(
            HTTPStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, "Something went wrong."
        )
