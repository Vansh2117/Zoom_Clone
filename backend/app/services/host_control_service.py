"""Host-only in-meeting actions (bonus feature): mute everyone, remove someone.

These are enforced server-side: the browser's video token carries no admin
rights, so a guest cannot mute or kick people even with a modified client.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import InvalidMeetingStateError, ParticipantNotFoundError
from app.core.time import utcnow
from app.domain.enums import MeetingStatus, ParticipantRole
from app.models import Meeting, Participant, User
from app.services.guards import ensure_host, get_meeting_or_404
from app.services.video import VideoService


class HostControlService:
    def __init__(self, db: Session, video: VideoService) -> None:
        self._db = db
        self._video = video

    def mute_all(self, meeting_code: str, user: User) -> None:
        meeting = self._get_active_meeting_as_host(meeting_code, user)
        host_identities = {
            participant.identity
            for participant in meeting.participants
            if participant.role == ParticipantRole.HOST
        }
        self._video.mute_all(meeting.meeting_code, except_identities=host_identities)

    def remove_participant(self, meeting_code: str, user: User, identity: str) -> None:
        meeting = self._get_active_meeting_as_host(meeting_code, user)
        participant = self._db.scalar(
            select(Participant).where(
                Participant.meeting_id == meeting.id, Participant.identity == identity
            )
        )
        if participant is None or participant.left_at is not None:
            raise ParticipantNotFoundError()
        if participant.role == ParticipantRole.HOST:
            raise InvalidMeetingStateError("The host cannot be removed from the meeting.")

        self._video.remove_participant(meeting.meeting_code, identity)
        participant.left_at = utcnow()
        self._db.commit()

    def _get_active_meeting_as_host(self, meeting_code: str, user: User) -> Meeting:
        meeting = get_meeting_or_404(self._db, meeting_code)
        ensure_host(meeting, user)
        if meeting.status != MeetingStatus.ACTIVE:
            raise InvalidMeetingStateError(
                "Host controls are only available during a live meeting."
            )
        return meeting
