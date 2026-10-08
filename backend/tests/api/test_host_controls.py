from sqlalchemy import select

from app.models import Participant
from tests.helpers import create_instant, create_scheduled, error_code, join, new_identity


def start_meeting_with_guests(client):
    code = create_instant(client)["meeting_code"]
    host_identity, guest_identity = new_identity(), new_identity()
    join(client, code, role="host", identity=host_identity, name="Vansh Sharma")
    join(client, code, identity=guest_identity, name="Priya")
    return code, host_identity, guest_identity


class TestMuteAll:
    def test_mutes_everyone_except_host(self, client, video):
        code, host_identity, _ = start_meeting_with_guests(client)

        response = client.post(f"/api/meetings/{code}/host/mute-all")

        assert response.status_code == 204
        assert video.mute_all_calls == [(code, {host_identity})]

    def test_requires_live_meeting(self, client):
        code = create_scheduled(client)["meeting_code"]
        response = client.post(f"/api/meetings/{code}/host/mute-all")
        assert response.status_code == 409
        assert error_code(response) == "INVALID_MEETING_STATE"


class TestRemoveParticipant:
    def test_host_removes_guest(self, client, video, db):
        code, _, guest_identity = start_meeting_with_guests(client)

        response = client.post(
            f"/api/meetings/{code}/host/remove", json={"identity": guest_identity}
        )

        assert response.status_code == 204
        assert video.removed == [(code, guest_identity)]
        guest = db.scalar(select(Participant).where(Participant.identity == guest_identity))
        assert guest.left_at is not None

    def test_cannot_remove_host(self, client, video):
        code, host_identity, _ = start_meeting_with_guests(client)

        response = client.post(
            f"/api/meetings/{code}/host/remove", json={"identity": host_identity}
        )

        assert response.status_code == 409
        assert video.removed == []

    def test_unknown_participant_returns_404(self, client):
        code, _, _ = start_meeting_with_guests(client)
        response = client.post(
            f"/api/meetings/{code}/host/remove", json={"identity": new_identity()}
        )
        assert response.status_code == 404
        assert error_code(response) == "PARTICIPANT_NOT_FOUND"

    def test_removing_twice_returns_404(self, client):
        code, _, guest_identity = start_meeting_with_guests(client)
        url = f"/api/meetings/{code}/host/remove"
        client.post(url, json={"identity": guest_identity})
        assert client.post(url, json={"identity": guest_identity}).status_code == 404

    def test_rejects_malformed_identity(self, client):
        code, _, _ = start_meeting_with_guests(client)
        response = client.post(f"/api/meetings/{code}/host/remove", json={"identity": "../x"})
        assert response.status_code == 400
