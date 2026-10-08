from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Literal, get_args

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, field_validator

from app.core.time import utcnow
from app.domain.enums import MeetingStatus
from app.domain.text import clean_text
from app.schemas.user import HostOut

if TYPE_CHECKING:
    from app.models.meeting import Meeting

AllowedDuration = Literal[15, 30, 45, 60, 90, 120]
ALLOWED_DURATIONS: tuple[int, ...] = get_args(AllowedDuration)

TITLE_MAX_LENGTH = 200
DESCRIPTION_MAX_LENGTH = 2000
# Small tolerance so a form submitted "for right now" is not rejected because
# of clock drift between the browser and the server.
PAST_SCHEDULE_TOLERANCE = timedelta(minutes=2)
MAX_SCHEDULE_AHEAD = timedelta(days=365)


class MeetingCreate(BaseModel):
    """Body of `POST /api/meetings` (schedule a meeting)."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=TITLE_MAX_LENGTH)
    description: str | None = Field(default=None, max_length=DESCRIPTION_MAX_LENGTH)
    # AwareDatetime rejects "2026-10-09T10:00:00" (no offset): the client must
    # say which timezone it means. We normalise to UTC below.
    scheduled_at: AwareDatetime
    duration_minutes: AllowedDuration

    @field_validator("title")
    @classmethod
    def _validate_title(cls, value: str) -> str:
        return clean_text(value, field="Title")

    @field_validator("description")
    @classmethod
    def _validate_description(cls, value: str | None) -> str | None:
        if not value:
            return None
        return clean_text(value, field="Description", multiline=True)

    @field_validator("scheduled_at")
    @classmethod
    def _validate_scheduled_at(cls, value: datetime) -> datetime:
        value = value.astimezone(UTC)
        now = utcnow()
        if value < now - PAST_SCHEDULE_TOLERANCE:
            raise ValueError("Meeting time must be in the future")
        if value > now + MAX_SCHEDULE_AHEAD:
            raise ValueError("Meetings can be scheduled at most one year ahead")
        return value


class MeetingOut(BaseModel):
    meeting_code: str
    title: str
    description: str | None
    status: MeetingStatus
    is_instant: bool
    scheduled_at: datetime
    scheduled_end_at: datetime
    duration_minutes: int
    created_at: datetime
    started_at: datetime | None
    ended_at: datetime | None
    host: HostOut
    participant_count: int
    invite_url: str

    @classmethod
    def from_model(cls, meeting: Meeting, public_app_url: str) -> MeetingOut:
        return cls(
            meeting_code=meeting.meeting_code,
            title=meeting.title,
            description=meeting.description,
            status=meeting.status,
            is_instant=meeting.is_instant,
            scheduled_at=meeting.scheduled_at,
            scheduled_end_at=meeting.scheduled_end_at,
            duration_minutes=meeting.duration_minutes,
            created_at=meeting.created_at,
            started_at=meeting.started_at,
            ended_at=meeting.ended_at,
            host=HostOut.model_validate(meeting.host),
            participant_count=meeting.participant_count,
            invite_url=build_invite_url(public_app_url, meeting.meeting_code),
        )


def build_invite_url(public_app_url: str, meeting_code: str) -> str:
    """The shareable link is derived from the code, never stored: one source of truth."""
    return f"{public_app_url.rstrip('/')}/j/{meeting_code}"
