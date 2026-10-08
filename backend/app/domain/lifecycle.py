"""Meeting lifecycle rules.

State machine (the only legal transitions):

    SCHEDULED ──(host joins)──▶ ACTIVE ──(host ends for all)──▶ ENDED

* Instant meetings are created directly in ACTIVE.
* ENDED is terminal: nobody can join again.
* A host merely *leaving* (or losing network / refreshing) does NOT end the
  meeting - only the explicit "End Meeting for All" action does.

"Upcoming" vs "Recent" is derived at read time from status + time window,
so there is no background job that has to flip statuses on a timer.
"""

from datetime import datetime, timedelta
from typing import Protocol

from app.domain.enums import MeetingStatus

ALLOWED_TRANSITIONS: dict[MeetingStatus, frozenset[MeetingStatus]] = {
    MeetingStatus.SCHEDULED: frozenset({MeetingStatus.ACTIVE}),
    MeetingStatus.ACTIVE: frozenset({MeetingStatus.ENDED}),
    MeetingStatus.ENDED: frozenset(),
}


def can_transition(current: MeetingStatus, target: MeetingStatus) -> bool:
    return target in ALLOWED_TRANSITIONS[current]


class MeetingWindow(Protocol):
    """Minimal shape needed to classify a meeting (the ORM model satisfies it)."""

    status: MeetingStatus
    scheduled_at: datetime
    duration_minutes: int


def scheduled_end(meeting: MeetingWindow) -> datetime:
    return meeting.scheduled_at + timedelta(minutes=meeting.duration_minutes)


def is_upcoming(meeting: MeetingWindow, now: datetime) -> bool:
    """Live meetings, plus scheduled meetings whose time slot has not passed yet."""
    if meeting.status == MeetingStatus.ACTIVE:
        return True
    if meeting.status == MeetingStatus.SCHEDULED:
        return scheduled_end(meeting) > now
    return False


def is_recent(meeting: MeetingWindow, now: datetime) -> bool:
    """Ended meetings, plus scheduled meetings whose slot passed without being started.

    Upcoming and recent are complementary, so every meeting appears in exactly
    one dashboard section.
    """
    return not is_upcoming(meeting, now)
