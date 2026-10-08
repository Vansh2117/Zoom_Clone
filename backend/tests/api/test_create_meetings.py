from datetime import datetime, timedelta

import pytest

from app.core.time import utcnow
from tests.helpers import create_instant, error_code, schedule_payload


class TestInstantMeeting:
    def test_creates_active_meeting_hosted_by_current_user(self, client):
        meeting = create_instant(client)

        assert meeting["status"] == "active"
        assert meeting["is_instant"] is True
        assert meeting["title"] == "Vansh Sharma's Zoom Meeting"
        assert meeting["host"]["name"] == "Vansh Sharma"
        assert meeting["started_at"] is not None
        assert meeting["participant_count"] == 0

    def test_generates_ten_digit_code_and_invite_link(self, client):
        meeting = create_instant(client)
        code = meeting["meeting_code"]

        assert code.isdigit() and len(code) == 10
        assert meeting["invite_url"] == f"http://app.test/j/{code}"

    def test_each_meeting_gets_a_unique_code(self, client):
        codes = {create_instant(client)["meeting_code"] for _ in range(25)}
        assert len(codes) == 25

    def test_timestamps_are_serialised_as_utc(self, client):
        meeting = create_instant(client)
        assert meeting["scheduled_at"].endswith("Z")
        assert meeting["created_at"].endswith("Z")


class TestScheduleMeeting:
    def test_creates_scheduled_meeting(self, client):
        payload = schedule_payload(title="  Quarterly   Review ", duration_minutes=90)
        response = client.post("/api/meetings", json=payload)

        assert response.status_code == 201
        meeting = response.json()
        assert meeting["status"] == "scheduled"
        assert meeting["is_instant"] is False
        assert meeting["title"] == "Quarterly Review"
        assert meeting["description"] == "Walk through the new dashboard"
        assert meeting["duration_minutes"] == 90
        assert meeting["started_at"] is None
        assert meeting["invite_url"].endswith(f"/j/{meeting['meeting_code']}")

    def test_converts_local_time_to_utc(self, client):
        start_ist = (
            (utcnow() + timedelta(days=2))
            .replace(microsecond=0)
            .astimezone(datetime.now().astimezone().tzinfo)
        )
        payload = schedule_payload(scheduled_at=start_ist.isoformat())
        meeting = client.post("/api/meetings", json=payload).json()

        stored = datetime.fromisoformat(meeting["scheduled_at"].replace("Z", "+00:00"))
        assert stored == start_ist
        assert meeting["scheduled_end_at"] == (
            (stored + timedelta(minutes=30)).isoformat().replace("+00:00", "Z")
        )

    def test_description_is_optional(self, client):
        payload = schedule_payload()
        del payload["description"]
        response = client.post("/api/meetings", json=payload)
        assert response.status_code == 201
        assert response.json()["description"] is None

    @pytest.mark.parametrize(
        ("overrides", "field"),
        [
            ({"title": ""}, "title"),
            ({"title": "x" * 201}, "title"),
            ({"title": "<script>alert('x')</script>"}, "title"),
            ({"description": "<img src=x onerror=alert(1)>"}, "description"),
            ({"duration_minutes": 40}, "duration_minutes"),
            ({"duration_minutes": "sixty"}, "duration_minutes"),
            ({"scheduled_at": "not-a-date"}, "scheduled_at"),
            ({"scheduled_at": "2030-01-01T10:00:00"}, "scheduled_at"),  # no timezone
        ],
    )
    def test_rejects_invalid_input_with_400(self, client, overrides, field):
        response = client.post("/api/meetings", json=schedule_payload(**overrides))

        assert response.status_code == 400
        error = response.json()["error"]
        assert error["code"] == "VALIDATION_ERROR"
        assert any(detail["field"] == field for detail in error["details"])

    def test_rejects_meeting_in_the_past(self, client):
        past = (utcnow() - timedelta(hours=3)).isoformat()
        response = client.post("/api/meetings", json=schedule_payload(scheduled_at=past))

        assert response.status_code == 400
        assert error_code(response) == "VALIDATION_ERROR"
        assert "future" in response.json()["error"]["message"]

    def test_rejects_missing_fields(self, client):
        response = client.post("/api/meetings", json={})
        assert response.status_code == 400
        fields = {detail["field"] for detail in response.json()["error"]["details"]}
        assert {"title", "scheduled_at", "duration_minutes"} <= fields

    def test_client_cannot_set_status(self, client):
        response = client.post("/api/meetings", json=schedule_payload(status="active"))
        assert response.status_code == 400
