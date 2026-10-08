import pytest

from tests.helpers import create_instant, create_scheduled, error_code


def test_returns_meeting_details(client):
    created = create_scheduled(client, title="Standup")
    response = client.get(f"/api/meetings/{created['meeting_code']}")

    assert response.status_code == 200
    assert response.json()["title"] == "Standup"
    assert response.json()["status"] == "scheduled"


def test_unknown_code_returns_404(client):
    response = client.get("/api/meetings/9999999999")
    assert response.status_code == 404
    assert error_code(response) == "MEETING_NOT_FOUND"


@pytest.mark.parametrize("code", ["123", "abcdefghij", "123456789012"])
def test_malformed_code_returns_400(client, code):
    response = client.get(f"/api/meetings/{code}")
    assert response.status_code == 400
    assert error_code(response) == "VALIDATION_ERROR"


def test_ended_meeting_is_still_readable_with_status(client):
    meeting = create_instant(client)
    client.post(f"/api/meetings/{meeting['meeting_code']}/end")

    response = client.get(f"/api/meetings/{meeting['meeting_code']}")
    assert response.status_code == 200
    assert response.json()["status"] == "ended"
    assert response.json()["ended_at"] is not None
