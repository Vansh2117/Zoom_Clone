from tests.helpers import error_code


def test_health_reports_ok_and_video_status(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "video_configured": True}


def test_me_returns_seeded_default_user(client):
    response = client.get("/api/me")
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Vansh Sharma"
    assert body["email"] == "vansh.sharma@example.com"
    assert body["personal_meeting_id"].isdigit()
    assert len(body["personal_meeting_id"]) == 10


def test_unknown_route_uses_error_envelope(client):
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
    assert error_code(response) == "NOT_FOUND"


def test_cors_allows_frontend_origin(client):
    response = client.options(
        "/api/meetings/instant",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_rejects_unknown_origin(client):
    response = client.options(
        "/api/meetings/instant",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in response.headers
