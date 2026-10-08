"""FastAPI dependencies: the wiring between HTTP and the service layer.

Everything a route needs (DB session, current user, services) is injected
here, which is also what lets tests swap the video provider for a fake.
"""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Path, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import UnauthorizedError
from app.domain.meeting_code import MEETING_CODE_REGEX
from app.models import User
from app.services.host_control_service import HostControlService
from app.services.meeting_service import MeetingService
from app.services.participant_service import ParticipantService
from app.services.video import VideoService


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_db(request: Request) -> Iterator[Session]:
    session = request.app.state.session_factory()
    try:
        yield session
    finally:
        session.close()


def get_video_service(request: Request) -> VideoService:
    return request.app.state.video_service


SettingsDep = Annotated[Settings, Depends(get_settings)]
DbSession = Annotated[Session, Depends(get_db)]
VideoDep = Annotated[VideoService, Depends(get_video_service)]


def get_current_user(db: DbSession, settings: SettingsDep) -> User:
    """Authentication seam.

    The assignment says to assume a default logged-in user, so we resolve the
    seeded user. Swapping this single function for real token verification
    (e.g. decode a JWT and load the user) makes every host-only check in the
    services enforce real authorization, with no other code changes.
    """
    user = db.scalar(select(User).where(User.email == settings.default_user_email))
    if user is None:
        raise UnauthorizedError("Default user not found. Restart the API to seed the database.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

MeetingCode = Annotated[
    str,
    Path(pattern=MEETING_CODE_REGEX, description="9-11 digit meeting ID", examples=["8272914420"]),
]


def get_meeting_service(db: DbSession, video: VideoDep) -> MeetingService:
    return MeetingService(db, video)


def get_participant_service(db: DbSession, video: VideoDep) -> ParticipantService:
    return ParticipantService(db, video)


def get_host_control_service(db: DbSession, video: VideoDep) -> HostControlService:
    return HostControlService(db, video)


MeetingServiceDep = Annotated[MeetingService, Depends(get_meeting_service)]
ParticipantServiceDep = Annotated[ParticipantService, Depends(get_participant_service)]
HostControlServiceDep = Annotated[HostControlService, Depends(get_host_control_service)]
