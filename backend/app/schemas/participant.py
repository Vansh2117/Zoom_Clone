from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain.enums import ParticipantRole
from app.domain.text import clean_text
from app.schemas.meeting import MeetingOut

DISPLAY_NAME_MAX_LENGTH = 50
# Generated in the browser (crypto.randomUUID) and kept per tab, so a refresh
# rejoins as the same participant instead of appearing twice.
IDENTITY_PATTERN = r"^[A-Za-z0-9_-]{8,64}$"


class JoinRequest(BaseModel):
    """Body of `POST /api/meetings/{code}/join`."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    display_name: str = Field(min_length=1, max_length=DISPLAY_NAME_MAX_LENGTH)
    identity: str = Field(pattern=IDENTITY_PATTERN)
    role: ParticipantRole = ParticipantRole.GUEST

    @field_validator("display_name")
    @classmethod
    def _validate_display_name(cls, value: str) -> str:
        return clean_text(value, field="Display name")


class JoinResponse(BaseModel):
    """Everything the browser needs to connect to the video room."""

    token: str
    server_url: str
    identity: str
    role: ParticipantRole
    meeting: MeetingOut


class ParticipantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    identity: str
    display_name: str
    role: ParticipantRole
    joined_at: datetime
    left_at: datetime | None


class RemoveParticipantRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    identity: str = Field(pattern=IDENTITY_PATTERN)
