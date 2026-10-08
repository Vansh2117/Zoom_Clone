"""The boundary between our backend and the real-time video provider.

Services depend on this Protocol, not on LiveKit directly. That gives us:
* tests that run without network access (they inject a fake),
* a single file to change if we ever swap LiveKit for another provider.

Ownership split:
* our database owns meeting metadata, lifecycle and attendance history;
* the video provider owns live media and presence (who is connected, mute state).
"""

from typing import Protocol


class VideoService(Protocol):
    @property
    def is_configured(self) -> bool: ...

    @property
    def server_url(self) -> str:
        """WebSocket URL the browser connects to."""
        ...

    def create_access_token(
        self, *, room: str, identity: str, display_name: str, is_host: bool
    ) -> str:
        """Mint a short-lived token that lets one participant join one room."""
        ...

    def close_room(self, room: str) -> None:
        """Disconnect everyone and destroy the room. Must not fail if the room is gone."""
        ...

    def mute_all(self, room: str, *, except_identities: set[str]) -> None:
        """Server-side mute of every published microphone except the given identities."""
        ...

    def remove_participant(self, room: str, identity: str) -> None: ...
