from sqlalchemy import select

from app.models import Participant
from tests.helpers import create_instant, create_scheduled, error_code, join, new_identity


class TestJoin:
    def test_guest_joins_live_meeting_and_gets_token(self, client, video):
        code = create_instant(client)["meeting_code"]
        identity = new_identity()

        response = join(client, code, identity=identity, name="Priya")

        assert response.status_code == 200
        body = response.json()
        assert body["token"] == f"token:{code}:{identity}"
        assert body["server_url"] == "wss://fake-livekit.test"
        assert body["identity"] == identity
        assert body["role"] == "guest"
        assert body["meeting"]["meeting_code"] == code
        assert video.tokens[-1] == {
            "room": code,
            "identity": identity,
            "name": "Priya",
            "is_host": False,
        }

    def test_join_records_attendance(self, client, db):
        code = create_instant(client)["meeting_code"]
        identity = new_identity()
        join(client, code, identity=identity, name="Priya")

        participant = db.scalar(select(Participant).where(Participant.identity == identity))
        assert participant.display_name == "Priya"
        assert participant.role == "guest"
        assert participant.user_id is None
        assert participant.left_at is None

    def test_host_join_starts_scheduled_meeting(self, client, video):
        code = create_scheduled(client)["meeting_code"]

        response = join(client, code, role="host", name="Vansh Sharma")

        assert response.status_code == 200
        assert response.json()["meeting"]["status"] == "active"
        assert response.json()["meeting"]["started_at"] is not None
        assert video.tokens[-1]["is_host"] is True

    def test_guest_must_wait_for_host_to_start(self, client):
        code = create_scheduled(client)["meeting_code"]

        response = join(client, code)

        assert response.status_code == 409
        assert error_code(response) == "MEETING_NOT_STARTED"
        assert client.get(f"/api/meetings/{code}").json()["status"] == "scheduled"

    def test_guest_can_join_after_host_starts(self, client):
        code = create_scheduled(client)["meeting_code"]
        join(client, code, role="host")
        assert join(client, code).status_code == 200

    def test_cannot_join_ended_meeting(self, client):
        code = create_instant(client)["meeting_code"]
        client.post(f"/api/meetings/{code}/end")

        response = join(client, code)
        assert response.status_code == 410
        assert error_code(response) == "MEETING_ENDED"

    def test_unknown_meeting_returns_404(self, client):
        response = join(client, "1234567890")
        assert response.status_code == 404
        assert error_code(response) == "MEETING_NOT_FOUND"

    def test_rejoin_with_same_identity_reuses_attendance_row(self, client, db):
        code = create_instant(client)["meeting_code"]
        identity = new_identity()

        join(client, code, identity=identity, name="Priya")
        client.post(f"/api/meetings/{code}/participants/{identity}/leave")
        join(client, code, identity=identity, name="Priya N")  # e.g. page refresh

        rows = db.scalars(select(Participant).where(Participant.identity == identity)).all()
        assert len(rows) == 1
        assert rows[0].display_name == "Priya N"
        assert rows[0].left_at is None

    def test_rejects_html_in_display_name(self, client):
        code = create_instant(client)["meeting_code"]
        response = join(client, code, name="<script>alert(1)</script>")
        assert response.status_code == 400
        assert response.json()["error"]["details"][0]["field"] == "display_name"

    def test_rejects_too_long_display_name(self, client):
        code = create_instant(client)["meeting_code"]
        assert join(client, code, name="x" * 51).status_code == 400

    def test_returns_503_without_side_effects_when_video_not_configured(self, client, video, db):
        code = create_scheduled(client)["meeting_code"]
        video.configured = False

        response = join(client, code, role="host")

        assert response.status_code == 503
        assert error_code(response) == "VIDEO_SERVICE_UNAVAILABLE"
        assert client.get(f"/api/meetings/{code}").json()["status"] == "scheduled"
        assert db.scalars(select(Participant)).all() == []


class TestLeave:
    def test_leave_sets_left_at(self, client, db):
        code = create_instant(client)["meeting_code"]
        identity = new_identity()
        join(client, code, identity=identity)

        response = client.post(f"/api/meetings/{code}/participants/{identity}/leave")

        assert response.status_code == 204
        participant = db.scalar(select(Participant).where(Participant.identity == identity))
        assert participant.left_at is not None

    def test_leave_is_idempotent_and_silent_for_unknown_identity(self, client):
        code = create_instant(client)["meeting_code"]
        url = f"/api/meetings/{code}/participants/{new_identity()}/leave"
        assert client.post(url).status_code == 204
        assert client.post(url).status_code == 204

    def test_host_leaving_does_not_end_the_meeting(self, client):
        code = create_instant(client)["meeting_code"]
        identity = new_identity()
        join(client, code, role="host", identity=identity)

        client.post(f"/api/meetings/{code}/participants/{identity}/leave")

        assert client.get(f"/api/meetings/{code}").json()["status"] == "active"


class TestAttendance:
    def test_host_can_list_attendance(self, client):
        code = create_instant(client)["meeting_code"]
        join(client, code, role="host", name="Vansh Sharma")
        join(client, code, name="Priya")

        response = client.get(f"/api/meetings/{code}/participants")

        assert response.status_code == 200
        assert [p["display_name"] for p in response.json()] == ["Vansh Sharma", "Priya"]
        assert [p["role"] for p in response.json()] == ["host", "guest"]
