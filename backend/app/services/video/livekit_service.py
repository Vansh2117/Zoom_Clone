"""LiveKit implementation of `VideoService`.

Our endpoints are synchronous (SQLAlchemy sessions are sync), but the LiveKit
server SDK is async. FastAPI runs sync endpoints in a worker thread that has
no event loop, so `asyncio.run` safely executes each server API call there.
"""

import asyncio
import json
import logging
import re
from collections.abc import Awaitable, Callable
from datetime import timedelta
from typing import TypeVar

from livekit import api

from app.core.config import Settings
from app.core.errors import VideoServiceError, VideoServiceUnavailableError

logger = logging.getLogger(__name__)

T = TypeVar("T")


class LiveKitVideoService:
    def __init__(self, settings: Settings) -> None:
        self._url = settings.livekit_url
        self._api_key = settings.livekit_api_key
        self._api_secret = settings.livekit_api_secret
        self._token_ttl = timedelta(minutes=settings.livekit_token_ttl_minutes)

    @property
    def is_configured(self) -> bool:
        return all((self._url, self._api_key, self._api_secret))

    @property
    def server_url(self) -> str:
        return self._url

    def create_access_token(
        self, *, room: str, identity: str, display_name: str, is_host: bool
    ) -> str:
        self._ensure_configured()
        # Least privilege: the token lets the holder join *this* room only, with
        # normal media permissions. Host powers (mute all, remove, end) are not
        # granted to the browser; they go through our API, which checks the
        # host's identity and then calls LiveKit with the server secret.
        grants = api.VideoGrants(
            room_join=True,
            room=room,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,  # needed for in-meeting chat
        )
        metadata = json.dumps({"role": "host" if is_host else "guest"})
        return (
            api.AccessToken(self._api_key, self._api_secret)
            .with_identity(identity)
            .with_name(display_name)
            .with_metadata(metadata)
            .with_ttl(self._token_ttl)
            .with_grants(grants)
            .to_jwt()
        )

    def close_room(self, room: str) -> None:
        if not self.is_configured:
            return
        try:
            self._run(lambda lk: lk.room.delete_room(api.DeleteRoomRequest(room=room)))
        except VideoServiceError:
            # The room may never have been created (nobody connected) or may
            # already be gone. Ending the meeting in our DB must still succeed.
            logger.warning("Could not close LiveKit room %s", room)

    def mute_all(self, room: str, *, except_identities: set[str]) -> None:
        async def operation(lk: api.LiveKitAPI) -> None:
            response = await lk.room.list_participants(api.ListParticipantsRequest(room=room))
            for participant in response.participants:
                if participant.identity in except_identities:
                    continue
                for track in participant.tracks:
                    if track.type == api.TrackType.AUDIO and not track.muted:
                        await lk.room.mute_published_track(
                            api.MuteRoomTrackRequest(
                                room=room,
                                identity=participant.identity,
                                track_sid=track.sid,
                                muted=True,
                            )
                        )

        self._run(operation)

    def remove_participant(self, room: str, identity: str) -> None:
        self._run(
            lambda lk: lk.room.remove_participant(
                api.RoomParticipantIdentity(room=room, identity=identity)
            )
        )

    # -- internals ---------------------------------------------------------

    def _ensure_configured(self) -> None:
        if not self.is_configured:
            raise VideoServiceUnavailableError(
                "Video service is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY and "
                "LIVEKIT_API_SECRET in backend/.env."
            )

    def _run(self, operation: Callable[[api.LiveKitAPI], Awaitable[T]]) -> T:
        self._ensure_configured()

        async def runner() -> T:
            client = api.LiveKitAPI(_to_http_url(self._url), self._api_key, self._api_secret)
            try:
                return await operation(client)
            finally:
                await client.aclose()

        try:
            return asyncio.run(runner())
        except Exception as exc:  # SDK raises TwirpError / aiohttp errors
            logger.exception("LiveKit server API call failed")
            raise VideoServiceError() from exc


def _to_http_url(url: str) -> str:
    """The server API is HTTP(S); the client URL is usually ws(s)://."""
    return re.sub(r"^ws", "http", url)
