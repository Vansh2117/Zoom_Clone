"""Small reusable checks shared by the services."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ForbiddenError, MeetingEndedError, MeetingNotFoundError
from app.domain.enums import MeetingStatus
from app.models import Meeting, User


def get_meeting_or_404(db: Session, meeting_code: str) -> Meeting:
    meeting = db.scalar(select(Meeting).where(Meeting.meeting_code == meeting_code))
    if meeting is None:
        raise MeetingNotFoundError()
    return meeting


def ensure_host(meeting: Meeting, user: User) -> None:
    if meeting.host_id != user.id:
        raise ForbiddenError()


def ensure_not_ended(meeting: Meeting) -> None:
    if meeting.status == MeetingStatus.ENDED:
        raise MeetingEndedError()
