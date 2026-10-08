"""Joining and leaving meetings, and attendance history."""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import MeetingNotStartedError, VideoServiceUnavailableError
from app.core.time import utcnow
from app.domain.enums import MeetingStatus, ParticipantRole
from app.domain.lifecycle import can_transition
from app.models import Meeting, Participant, User
from app.schemas.participant import JoinRequest
from app.services.guards import ensure_host, ensure_not_ended, get_meeting_or_404
from app.services.video import VideoService


@dataclass(frozen=True)
class JoinResult:
    meeting: Meeting
    participant: Participant
    token: str
    server_url: str


class ParticipantService:
    def __init__(self, db: Session, video: VideoService) -> None:
        self._db = db
        self._video = video

    def join(self, meeting_code: str, user: User, request: JoinRequest) -> JoinResult:
        """Validate the meeting, record attendance and issue a video token.

        Recording attendance here (server-side, in the same call that issues the
        token) means every person in the room has an attendance row - the
        browser cannot skip it.
        """
        meeting = get_meeting_or_404(self._db, meeting_code)
        ensure_not_ended(meeting)
        # Check before changing anything, so a misconfigured server has no side effects.
        if not self._video.is_configured:
            raise VideoServiceUnavailableError()

        is_host = request.role == ParticipantRole.HOST
        if is_host:
            ensure_host(meeting, user)
            self._start_if_scheduled(meeting)
        elif meeting.status == MeetingStatus.SCHEDULED:
            # Like Zoom: guests wait until the host starts the meeting.
            raise MeetingNotStartedError()

        participant = self._upsert_participant(meeting, user, request)
        self._db.commit()

        token = self._video.create_access_token(
            room=meeting.meeting_code,
            identity=participant.identity,
            display_name=participant.display_name,
            is_host=is_host,
        )
        return JoinResult(meeting, participant, token, self._video.server_url)

    def leave(self, meeting_code: str, identity: str) -> None:
        """Mark a participant as having left. Idempotent and silent for unknown identities,
        because it is called from `navigator.sendBeacon` on tab close."""
        meeting = get_meeting_or_404(self._db, meeting_code)
        participant = self._find(meeting, identity)
        if participant is not None and participant.left_at is None:
            participant.left_at = utcnow()
            self._db.commit()

    def attendance(self, meeting_code: str, user: User) -> list[Participant]:
        meeting = get_meeting_or_404(self._db, meeting_code)
        ensure_host(meeting, user)
        return list(meeting.participants)

    # -- internals ---------------------------------------------------------

    def _start_if_scheduled(self, meeting: Meeting) -> None:
        if meeting.status == MeetingStatus.SCHEDULED and can_transition(
            meeting.status, MeetingStatus.ACTIVE
        ):
            meeting.status = MeetingStatus.ACTIVE
            meeting.started_at = utcnow()

    def _upsert_participant(
        self, meeting: Meeting, user: User, request: JoinRequest
    ) -> Participant:
        """Rejoining with the same identity (page refresh, network drop) re-opens
        the existing attendance row instead of creating a duplicate."""
        participant = self._find(meeting, request.identity)
        if participant is None:
            participant = Participant(meeting=meeting, identity=request.identity)
            self._db.add(participant)

        participant.display_name = request.display_name
        participant.role = request.role
        participant.user_id = user.id if request.role == ParticipantRole.HOST else None
        participant.left_at = None
        return participant

    def _find(self, meeting: Meeting, identity: str) -> Participant | None:
        return self._db.scalar(
            select(Participant).where(
                Participant.meeting_id == meeting.id, Participant.identity == identity
            )
        )
