from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.core.time import utcnow
from app.schemas.meeting import ALLOWED_DURATIONS, MeetingCreate, build_invite_url
from app.schemas.participant import JoinRequest


def make_meeting(**overrides):
    data = {
        "title": "Weekly sync",
        "scheduled_at": (utcnow() + timedelta(days=1)).isoformat(),
        "duration_minutes": 30,
    }
    data.update(overrides)
    return MeetingCreate.model_validate(data)


class TestMeetingCreate:
    def test_valid_payload(self):
        meeting = make_meeting(description="  Agenda  ")
        assert meeting.title == "Weekly sync"
        assert meeting.description == "Agenda"
        assert meeting.scheduled_at.tzinfo is not None

    def test_scheduled_at_is_normalised_to_utc(self):
        ist = timezone(timedelta(hours=5, minutes=30))
        local = (utcnow() + timedelta(days=1)).astimezone(ist).replace(microsecond=0)
        meeting = make_meeting(scheduled_at=local.isoformat())
        assert meeting.scheduled_at.utcoffset() == timedelta(0)
        assert meeting.scheduled_at == local

    def test_blank_description_becomes_none(self):
        assert make_meeting(description="   ").description is None

    @pytest.mark.parametrize("duration", ALLOWED_DURATIONS)
    def test_allowed_durations(self, duration):
        assert make_meeting(duration_minutes=duration).duration_minutes == duration

    @pytest.mark.parametrize("duration", [0, 10, 40, 61, 180, -15])
    def test_rejects_other_durations(self, duration):
        with pytest.raises(ValidationError):
            make_meeting(duration_minutes=duration)

    def test_rejects_past_time(self):
        with pytest.raises(ValidationError, match="future"):
            make_meeting(scheduled_at=(utcnow() - timedelta(hours=1)).isoformat())

    def test_allows_small_clock_skew(self):
        make_meeting(scheduled_at=(utcnow() - timedelta(seconds=30)).isoformat())

    def test_rejects_more_than_a_year_ahead(self):
        with pytest.raises(ValidationError, match="one year"):
            make_meeting(scheduled_at=(utcnow() + timedelta(days=400)).isoformat())

    def test_rejects_naive_datetime(self):
        naive = (datetime.now(UTC) + timedelta(days=1)).replace(tzinfo=None).isoformat()
        with pytest.raises(ValidationError):
            make_meeting(scheduled_at=naive)

    @pytest.mark.parametrize("title", ["", "   ", "x" * 201, "<script>alert(1)</script>"])
    def test_rejects_bad_titles(self, title):
        with pytest.raises(ValidationError):
            make_meeting(title=title)

    def test_rejects_unknown_fields(self):
        with pytest.raises(ValidationError):
            make_meeting(status="ended")


class TestJoinRequest:
    def test_defaults_to_guest(self):
        request = JoinRequest(display_name="  Priya  ", identity="a1b2c3d4e5f6")
        assert request.role == "guest"
        assert request.display_name == "Priya"

    @pytest.mark.parametrize("name", ["", "   ", "x" * 51, "<b>bold</b>"])
    def test_rejects_bad_display_names(self, name):
        with pytest.raises(ValidationError):
            JoinRequest(display_name=name, identity="a1b2c3d4e5f6")

    def test_accepts_fifty_character_name(self):
        assert len(JoinRequest(display_name="x" * 50, identity="a1b2c3d4e5f6").display_name) == 50

    @pytest.mark.parametrize("identity", ["short", "has space here", "../../etc", "x" * 65])
    def test_rejects_bad_identities(self, identity):
        with pytest.raises(ValidationError):
            JoinRequest(display_name="Priya", identity=identity)


def test_invite_url_is_built_from_code():
    assert build_invite_url("https://zoom.example/", "1234567890") == (
        "https://zoom.example/j/1234567890"
    )
