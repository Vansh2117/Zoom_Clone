"""Test doubles."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class FakeVideoService:
    """In-memory stand-in for LiveKit that records every call."""

    configured: bool = True
    tokens: list[dict[str, Any]] = field(default_factory=list)
    closed_rooms: list[str] = field(default_factory=list)
    mute_all_calls: list[tuple[str, set[str]]] = field(default_factory=list)
    removed: list[tuple[str, str]] = field(default_factory=list)

    @property
    def is_configured(self) -> bool:
        return self.configured

    @property
    def server_url(self) -> str:
        return "wss://fake-livekit.test"

    def create_access_token(
        self, *, room: str, identity: str, display_name: str, is_host: bool
    ) -> str:
        self.tokens.append(
            {"room": room, "identity": identity, "name": display_name, "is_host": is_host}
        )
        return f"token:{room}:{identity}"

    def close_room(self, room: str) -> None:
        self.closed_rooms.append(room)

    def mute_all(self, room: str, *, except_identities: set[str]) -> None:
        self.mute_all_calls.append((room, except_identities))

    def remove_participant(self, room: str, identity: str) -> None:
        self.removed.append((room, identity))
