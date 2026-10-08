"""Idempotent database seeding.

Runs on every startup. It is safe to run repeatedly (and on hosts with an
ephemeral disk such as Render's free tier): the default user is created only
if missing, and sample meetings only if the meetings table is empty.
"""

from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.time import utcnow
from app.domain.enums import MeetingStatus, ParticipantRole
from app.domain.meeting_code import generate_meeting_code
from app.models import Meeting, Participant, User

_SAMPLE_GUESTS = ("Aarav Mehta", "Priya Nair", "Rohan Gupta", "Ananya Iyer")


def seed_database(session: Session, settings: Settings) -> None:
    user = ensure_default_user(session, settings)
    if settings.seed_sample_data and session.scalar(select(Meeting.id).limit(1)) is None:
        _create_sample_meetings(session, user)
    session.commit()


def ensure_default_user(session: Session, settings: Settings) -> User:
    user = session.scalar(select(User).where(User.email == settings.default_user_email))
    if user is None:
        user = User(
            name=settings.default_user_name,
            email=settings.default_user_email,
            personal_meeting_id=generate_meeting_code(),
        )
        session.add(user)
        session.flush()
    return user


def _create_sample_meetings(session: Session, host: User) -> None:
    now = utcnow()

    # Upcoming
    _scheduled(
        session,
        host,
        "1:1 with Mentor",
        _slot(now, hours=5),
        30,
        "Career discussion and project feedback.",
    )
    _scheduled(
        session,
        host,
        "Weekly Team Sync",
        _slot(now, days=1),
        30,
        "Status updates, blockers and plans for the week.",
    )
    _scheduled(session, host, "Design Review: Dashboard Revamp", _slot(now, days=2), 60, None)

    # Recent: ended meetings with attendance history
    _ended(session, host, "Sprint Planning", _slot(now, days=-1), 45, guests=3)
    _ended(session, host, "Project Kickoff", _slot(now, days=-3), 60, guests=4)

    # Recent: a scheduled meeting whose slot passed without the host starting it
    _scheduled(session, host, "Interview Prep", _slot(now, days=-2), 30, None)


def _slot(now: datetime, *, days: int = 0, hours: int = 0) -> datetime:
    """A time `days`/`hours` from now, rounded down to the half hour like Zoom's picker."""
    moment = now + timedelta(days=days, hours=hours)
    return moment.replace(minute=0 if moment.minute < 30 else 30, second=0, microsecond=0)


def _scheduled(
    session: Session,
    host: User,
    title: str,
    start: datetime,
    duration: int,
    description: str | None,
) -> Meeting:
    meeting = Meeting(
        meeting_code=generate_meeting_code(),
        host=host,
        title=title,
        description=description,
        scheduled_at=start,
        duration_minutes=duration,
        status=MeetingStatus.SCHEDULED,
    )
    session.add(meeting)
    return meeting


def _ended(
    session: Session, host: User, title: str, start: datetime, duration: int, guests: int
) -> None:
    end = start + timedelta(minutes=duration)
    meeting = _scheduled(session, host, title, start, duration, None)
    meeting.status = MeetingStatus.ENDED
    meeting.started_at = start
    meeting.ended_at = end

    meeting.participants.append(
        Participant(
            identity=uuid4().hex,
            display_name=host.name,
            role=ParticipantRole.HOST,
            user_id=host.id,
            joined_at=start,
            left_at=end,
        )
    )
    for index, name in enumerate(_SAMPLE_GUESTS[:guests]):
        meeting.participants.append(
            Participant(
                identity=uuid4().hex,
                display_name=name,
                role=ParticipantRole.GUEST,
                joined_at=start + timedelta(minutes=2 + index),
                left_at=end,
            )
        )
