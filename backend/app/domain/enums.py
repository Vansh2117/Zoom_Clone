from enum import StrEnum


class MeetingStatus(StrEnum):
    """Lifecycle of a meeting. See `app.domain.lifecycle` for legal transitions."""

    SCHEDULED = "scheduled"
    ACTIVE = "active"
    ENDED = "ended"


class ParticipantRole(StrEnum):
    HOST = "host"
    GUEST = "guest"
