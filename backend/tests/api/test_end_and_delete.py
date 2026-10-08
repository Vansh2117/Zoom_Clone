from sqlalchemy import select

from app.models import Participant
from tests.helpers import create_instant, create_scheduled, error_code, join, new_identity


class TestEndMeeting:
    def test_host_ends_meeting_for_all(self, client, video, db):
        code = create_instant(client)["meeting_code"]
        join(client, code, role="host")
        join(client, code, name="Priya")

        response = client.post(f"/api/meetings/{code}/end")

        assert response.status_code == 200
        assert response.json()["status"] == "ended"
        assert response.json()["ended_at"] is not None
        # The video room is closed, which disconnects everyone still connected.
        assert video.closed_rooms == [code]
        # Every open attendance row is closed.
        assert all(p.left_at is not None for p in db.scalars(select(Participant)))

    def test_ending_twice_is_idempotent(self, client, video):
        code = create_instant(client)["meeting_code"]
        client.post(f"/api/meetings/{code}/end")

        response = client.post(f"/api/meetings/{code}/end")

        assert response.status_code == 200
        assert response.json()["status"] == "ended"
        assert video.closed_rooms == [code]  # room closed only once

    def test_cannot_end_meeting_that_never_started(self, client):
        code = create_scheduled(client)["meeting_code"]

        response = client.post(f"/api/meetings/{code}/end")

        assert response.status_code == 409
        assert error_code(response) == "INVALID_MEETING_STATE"

    def test_only_host_can_end(self, client, app, db):
        code = create_instant(client)["meeting_code"]
        as_other_user(app, db)

        response = client.post(f"/api/meetings/{code}/end")

        assert response.status_code == 403
        assert error_code(response) == "FORBIDDEN"

    def test_end_unknown_meeting_returns_404(self, client):
        assert client.post("/api/meetings/1234567890/end").status_code == 404


class TestDeleteMeeting:
    def test_host_deletes_scheduled_meeting(self, client):
        code = create_scheduled(client)["meeting_code"]

        assert client.delete(f"/api/meetings/{code}").status_code == 204
        assert client.get(f"/api/meetings/{code}").status_code == 404

    def test_cannot_delete_live_or_ended_meeting(self, client):
        code = create_instant(client)["meeting_code"]
        response = client.delete(f"/api/meetings/{code}")
        assert response.status_code == 409

        client.post(f"/api/meetings/{code}/end")
        assert client.delete(f"/api/meetings/{code}").status_code == 409

    def test_only_host_can_delete(self, client, app, db):
        code = create_scheduled(client)["meeting_code"]
        as_other_user(app, db)
        assert client.delete(f"/api/meetings/{code}").status_code == 403


class TestHostRole:
    def test_non_host_cannot_join_as_host(self, client, app, db):
        code = create_scheduled(client)["meeting_code"]
        as_other_user(app, db)

        response = join(client, code, role="host", identity=new_identity())

        assert response.status_code == 403
        assert client.get(f"/api/meetings/{code}").json()["status"] == "scheduled"


def as_other_user(app, db):
    """Simulate a different logged-in user by overriding the auth seam."""
    from app.api.deps import get_current_user
    from app.models import User

    other = User(name="Someone Else", email="other@example.com", personal_meeting_id="5550001111")
    db.add(other)
    db.commit()
    app.dependency_overrides[get_current_user] = lambda: other
