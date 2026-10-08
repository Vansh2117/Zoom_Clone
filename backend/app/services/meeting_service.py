"""Meeting creation, listing and lifecycle (create -> start -> end)."""

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import InvalidMeetingStateError
from app.core.time import utcnow
from app.domain.enums import MeetingStatus
from app.domain.lifecycle import can_transition, is_recent, is_upcoming
from app.domain.meeting_code import generate_meeting_code
from app.models import Meeting, User
from app.schemas.meeting import MeetingCreate
from app.services.guards import ensure_host, get_meeting_or_404
from app.services.video import VideoService

INSTANT_MEETING_DURATION_MINUTES = 60
RECENT_MEETINGS_LIMIT = 20
_MAX_CODE_ATTEMPTS = 10


class MeetingService:
    def __init__(self, db: Session, video: VideoService) -> None:
        self._db = db
        self._video = video

    # -- create ------------------------------------------------------------

    def create_instant(self, host: User) -> Meeting:
        """Zoom's "New Meeting": starts immediately, so it is created ACTIVE."""
        now = utcnow()
        meeting = Meeting(
            meeting_code=self._generate_unique_code(),
            host=host,
            title=f"{host.name}'s Zoom Meeting",
            scheduled_at=now,
            duration_minutes=INSTANT_MEETING_DURATION_MINUTES,
            is_instant=True,
            status=MeetingStatus.ACTIVE,
            started_at=now,
        )
        return self._save(meeting)

    def schedule(self, host: User, data: MeetingCreate) -> Meeting:
        meeting = Meeting(
            meeting_code=self._generate_unique_code(),
            host=host,
            title=data.title,
            description=data.description,
            scheduled_at=data.scheduled_at,
            duration_minutes=data.duration_minutes,
            is_instant=False,
            status=MeetingStatus.SCHEDULED,
        )
        return self._save(meeting)

    # -- read --------------------------------------------------------------

    def get(self, meeting_code: str) -> Meeting:
        return get_meeting_or_404(self._db, meeting_code)

    def list_upcoming(self, host: User, now: datetime | None = None) -> list[Meeting]:
        """Live meetings first, then scheduled ones by start time (soonest first)."""
        now = now or utcnow()
        candidates = self._meetings_for_host(
            host, statuses=(MeetingStatus.SCHEDULED, MeetingStatus.ACTIVE)
        )
        upcoming = [m for m in candidates if is_upcoming(m, now)]
        return sorted(upcoming, key=lambda m: (m.status != MeetingStatus.ACTIVE, m.scheduled_at))

    def list_recent(
        self, host: User, now: datetime | None = None, limit: int = RECENT_MEETINGS_LIMIT
    ) -> list[Meeting]:
        """Ended meetings and missed scheduled ones, most recent first."""
        now = now or utcnow()
        candidates = self._meetings_for_host(
            host, statuses=(MeetingStatus.SCHEDULED, MeetingStatus.ENDED)
        )
        recent = [m for m in candidates if is_recent(m, now)]
        recent.sort(key=lambda m: m.ended_at or m.scheduled_end_at, reverse=True)
        return recent[:limit]

    # -- lifecycle ---------------------------------------------------------

    def end(self, meeting_code: str, user: User) -> Meeting:
        """Host's "End Meeting for All". Idempotent: ending twice is not an error."""
        meeting = self.get(meeting_code)
        ensure_host(meeting, user)

        if meeting.status == MeetingStatus.ENDED:
            return meeting
        if not can_transition(meeting.status, MeetingStatus.ENDED):
            raise InvalidMeetingStateError(
                "This meeting has not started yet. Delete it instead of ending it."
            )

        now = utcnow()
        meeting.status = MeetingStatus.ENDED
        meeting.ended_at = now
        for participant in meeting.participants:
            if participant.left_at is None:
                participant.left_at = now
        self._db.commit()

        # DB first, then the room: if closing the room fails, the meeting is
        # still ENDED and nobody can obtain a new token to rejoin.
        self._video.close_room(meeting.meeting_code)
        return meeting

    def delete_scheduled(self, meeting_code: str, user: User) -> None:
        """Zoom lets hosts delete meetings that have not started yet."""
        meeting = self.get(meeting_code)
        ensure_host(meeting, user)
        if meeting.status != MeetingStatus.SCHEDULED:
            raise InvalidMeetingStateError("Only meetings that have not started can be deleted.")
        self._db.delete(meeting)
        self._db.commit()

    # -- internals ---------------------------------------------------------

    def _meetings_for_host(
        self, host: User, statuses: Sequence[MeetingStatus]
    ) -> Sequence[Meeting]:
        # selectinload avoids N+1 queries when serialising participant counts.
        query = (
            select(Meeting)
            .where(Meeting.host_id == host.id, Meeting.status.in_(statuses))
            .options(selectinload(Meeting.participants), selectinload(Meeting.host))
        )
        return self._db.scalars(query).all()

    def _generate_unique_code(self) -> str:
        """Random codes with a collision check. The UNIQUE constraint on
        `meeting_code` remains the final guarantee under concurrent inserts."""
        for _ in range(_MAX_CODE_ATTEMPTS):
            code = generate_meeting_code()
            exists = self._db.scalar(select(Meeting.id).where(Meeting.meeting_code == code))
            if exists is None:
                return code
        raise RuntimeError("Could not generate a unique meeting code")

    def _save(self, meeting: Meeting) -> Meeting:
        self._db.add(meeting)
        self._db.commit()
        self._db.refresh(meeting)
        return meeting
