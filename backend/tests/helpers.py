"""Small helpers shared by API tests."""

from datetime import timedelta
from typing import Any
from uuid import uuid4

from fastapi.testclient import TestClient
from httpx import Response

from app.core.time import utcnow


def future_iso(**delta: float) -> str:
    return (utcnow() + timedelta(**delta)).isoformat()


def schedule_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "title": "Design Review",
        "description": "Walk through the new dashboard",
        "scheduled_at": future_iso(days=1),
        "duration_minutes": 30,
    }
    payload.update(overrides)
    return payload


def new_identity() -> str:
    return uuid4().hex


def create_instant(client: TestClient) -> dict[str, Any]:
    response = client.post("/api/meetings/instant")
    assert response.status_code == 201, response.text
    return response.json()


def create_scheduled(client: TestClient, **overrides: Any) -> dict[str, Any]:
    response = client.post("/api/meetings", json=schedule_payload(**overrides))
    assert response.status_code == 201, response.text
    return response.json()


def join(
    client: TestClient,
    code: str,
    *,
    role: str = "guest",
    identity: str | None = None,
    name: str = "Test User",
) -> Response:
    return client.post(
        f"/api/meetings/{code}/join",
        json={"display_name": name, "identity": identity or new_identity(), "role": role},
    )


def error_code(response: Response) -> str:
    return response.json()["error"]["code"]
