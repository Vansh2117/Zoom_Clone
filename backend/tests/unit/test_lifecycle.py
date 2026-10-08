from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import pytest

from app.domain.enums import MeetingStatus
from app.domain.lifecycle import can_transition, is_recent, is_upcoming, scheduled_end

NOW = datetime(2026, 10, 9, 12, 0, tzinfo=UTC)


@dataclass
class FakeMeeting:
    status: MeetingStatus
    scheduled_at: datetime
    duration_minutes: int = 30


@pytest.mark.parametrize(
    ("current", "target", "allowed"),
    [
        (MeetingStatus.SCHEDULED, MeetingStatus.ACTIVE, True),
        (MeetingStatus.ACTIVE, MeetingStatus.ENDED, True),
        (MeetingStatus.SCHEDULED, MeetingStatus.ENDED, False),
        (MeetingStatus.ACTIVE, MeetingStatus.SCHEDULED, False),
        (MeetingStatus.ENDED, MeetingStatus.ACTIVE, False),
        (MeetingStatus.ENDED, MeetingStatus.SCHEDULED, False),
    ],
)
def test_state_machine_transitions(current, target, allowed):
    assert can_transition(current, target) is allowed


def test_scheduled_end_adds_duration():
    meeting = FakeMeeting(MeetingStatus.SCHEDULED, NOW, duration_minutes=45)
    assert scheduled_end(meeting) == NOW + timedelta(minutes=45)


def test_future_scheduled_meeting_is_upcoming():
    meeting = FakeMeeting(MeetingStatus.SCHEDULED, NOW + timedelta(hours=1))
    assert is_upcoming(meeting, NOW)
    assert not is_recent(meeting, NOW)


def test_scheduled_meeting_still_upcoming_during_its_slot():
    meeting = FakeMeeting(MeetingStatus.SCHEDULED, NOW - timedelta(minutes=10), duration_minutes=30)
    assert is_upcoming(meeting, NOW)


def test_missed_scheduled_meeting_moves_to_recent():
    meeting = FakeMeeting(MeetingStatus.SCHEDULED, NOW - timedelta(hours=2), duration_minutes=30)
    assert not is_upcoming(meeting, NOW)
    assert is_recent(meeting, NOW)


def test_active_meeting_is_always_upcoming_even_when_overrunning():
    meeting = FakeMeeting(MeetingStatus.ACTIVE, NOW - timedelta(hours=5), duration_minutes=30)
    assert is_upcoming(meeting, NOW)


def test_ended_meeting_is_recent():
    meeting = FakeMeeting(MeetingStatus.ENDED, NOW + timedelta(hours=1))
    assert is_recent(meeting, NOW)
