from datetime import timedelta

from sqlalchemy import select

from app.core.time import utcnow
from app.domain.enums import MeetingStatus
from app.domain.meeting_code import generate_meeting_code
from app.models import Meeting, User
from tests.helpers import create_instant, create_scheduled, future_iso


def insert_meeting(db, *, title, status, start, duration=30, ended_at=None):
    """Insert directly so we can create meetings in the past (the API forbids that)."""
    host = db.scalar(select(User))
    meeting = Meeting(
        meeting_code=generate_meeting_code(),
        host=host,
        title=title,
        scheduled_at=start,
        duration_minutes=duration,
        status=status,
        started_at=start if status != MeetingStatus.SCHEDULED else None,
        ended_at=ended_at,
    )
    db.add(meeting)
    db.commit()
    return meeting


def titles(response):
    assert response.status_code == 200
    return [meeting["title"] for meeting in response.json()]


def test_empty_lists_when_no_meetings(client):
    assert client.get("/api/meetings/upcoming").json() == []
    assert client.get("/api/meetings/recent").json() == []


def test_upcoming_is_sorted_by_start_time_with_live_meetings_first(client):
    create_scheduled(client, title="In three days", scheduled_at=future_iso(days=3))
    create_scheduled(client, title="Tomorrow", scheduled_at=future_iso(days=1))
    create_instant(client)

    assert titles(client.get("/api/meetings/upcoming")) == [
        "Vansh Sharma's Zoom Meeting",
        "Tomorrow",
        "In three days",
    ]


def test_ended_meeting_moves_from_upcoming_to_recent(client):
    meeting = create_instant(client)
    client.post(f"/api/meetings/{meeting['meeting_code']}/end")

    assert titles(client.get("/api/meetings/upcoming")) == []
    assert titles(client.get("/api/meetings/recent")) == ["Vansh Sharma's Zoom Meeting"]


def test_recent_includes_missed_meetings_and_is_newest_first(client, db):
    now = utcnow()
    insert_meeting(
        db,
        title="Ended last week",
        status=MeetingStatus.ENDED,
        start=now - timedelta(days=7),
        ended_at=now - timedelta(days=7, minutes=-30),
    )
    insert_meeting(
        db,
        title="Ended yesterday",
        status=MeetingStatus.ENDED,
        start=now - timedelta(days=1),
        ended_at=now - timedelta(days=1, minutes=-30),
    )
    insert_meeting(
        db,
        title="Missed two days ago",
        status=MeetingStatus.SCHEDULED,
        start=now - timedelta(days=2),
    )

    assert titles(client.get("/api/meetings/recent")) == [
        "Ended yesterday",
        "Missed two days ago",
        "Ended last week",
    ]
    assert titles(client.get("/api/meetings/upcoming")) == []


def test_meeting_in_progress_window_stays_upcoming(client, db):
    insert_meeting(
        db,
        title="Started 10 min ago (not opened yet)",
        status=MeetingStatus.SCHEDULED,
        start=utcnow() - timedelta(minutes=10),
        duration=30,
    )
    assert titles(client.get("/api/meetings/upcoming")) == ["Started 10 min ago (not opened yet)"]


def test_recent_meetings_include_participant_count(client):
    meeting = create_instant(client)
    code = meeting["meeting_code"]
    for name in ("Host", "Guest One", "Guest Two"):
        role = "host" if name == "Host" else "guest"
        client.post(
            f"/api/meetings/{code}/join",
            json={
                "display_name": name,
                "identity": f"{name.replace(' ', '')}-identity",
                "role": role,
            },
        )
    client.post(f"/api/meetings/{code}/end")

    [recent] = client.get("/api/meetings/recent").json()
    assert recent["participant_count"] == 3
