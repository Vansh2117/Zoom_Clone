"""Application errors.

Services raise these; `app.core.error_handlers` turns every one of them into
the same JSON envelope:

    {"error": {"code": "MEETING_NOT_FOUND", "message": "...", "details": []}}

The frontend switches on the stable machine-readable `code`, never on the
human-readable `message`.
"""

from enum import StrEnum
from http import HTTPStatus


class ErrorCode(StrEnum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    MEETING_NOT_FOUND = "MEETING_NOT_FOUND"
    MEETING_ENDED = "MEETING_ENDED"
    MEETING_NOT_STARTED = "MEETING_NOT_STARTED"
    INVALID_MEETING_STATE = "INVALID_MEETING_STATE"
    PARTICIPANT_NOT_FOUND = "PARTICIPANT_NOT_FOUND"
    VIDEO_SERVICE_UNAVAILABLE = "VIDEO_SERVICE_UNAVAILABLE"
    VIDEO_SERVICE_ERROR = "VIDEO_SERVICE_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class AppError(Exception):
    status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR
    code: ErrorCode = ErrorCode.INTERNAL_ERROR
    default_message: str = "Something went wrong."

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.default_message
        super().__init__(self.message)


class UnauthorizedError(AppError):
    status_code = HTTPStatus.UNAUTHORIZED
    code = ErrorCode.UNAUTHORIZED
    default_message = "You need to be signed in to do that."


class ForbiddenError(AppError):
    status_code = HTTPStatus.FORBIDDEN
    code = ErrorCode.FORBIDDEN
    default_message = "Only the host can do that."


class MeetingNotFoundError(AppError):
    status_code = HTTPStatus.NOT_FOUND
    code = ErrorCode.MEETING_NOT_FOUND
    default_message = "This meeting ID is not valid."


class MeetingEndedError(AppError):
    # 410 Gone: the resource existed but is permanently unavailable.
    status_code = HTTPStatus.GONE
    code = ErrorCode.MEETING_ENDED
    default_message = "This meeting has ended."


class MeetingNotStartedError(AppError):
    status_code = HTTPStatus.CONFLICT
    code = ErrorCode.MEETING_NOT_STARTED
    default_message = "The host has not started this meeting yet."


class InvalidMeetingStateError(AppError):
    status_code = HTTPStatus.CONFLICT
    code = ErrorCode.INVALID_MEETING_STATE
    default_message = "This action is not allowed in the meeting's current state."


class ParticipantNotFoundError(AppError):
    status_code = HTTPStatus.NOT_FOUND
    code = ErrorCode.PARTICIPANT_NOT_FOUND
    default_message = "That participant is not in this meeting."


class VideoServiceUnavailableError(AppError):
    status_code = HTTPStatus.SERVICE_UNAVAILABLE
    code = ErrorCode.VIDEO_SERVICE_UNAVAILABLE
    default_message = "The video service is not configured on the server."


class VideoServiceError(AppError):
    status_code = HTTPStatus.BAD_GATEWAY
    code = ErrorCode.VIDEO_SERVICE_ERROR
    default_message = "The video service could not complete the request."
