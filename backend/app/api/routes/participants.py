from typing import Annotated

from fastapi import APIRouter, Path, Response, status

from app.api.deps import CurrentUser, MeetingCode, ParticipantServiceDep, SettingsDep
from app.schemas.meeting import MeetingOut
from app.schemas.participant import IDENTITY_PATTERN, JoinRequest, JoinResponse, ParticipantOut

router = APIRouter(prefix="/meetings/{meeting_code}", tags=["participants"])

Identity = Annotated[str, Path(pattern=IDENTITY_PATTERN)]


@router.post("/join", response_model=JoinResponse)
def join_meeting(
    meeting_code: MeetingCode,
    body: JoinRequest,
    user: CurrentUser,
    service: ParticipantServiceDep,
    settings: SettingsDep,
) -> JoinResponse:
    """Validate the meeting, record attendance and return a video-room token.

    Errors: 404 unknown meeting, 410 meeting ended, 409 host has not started it
    yet (guests), 403 not the host (host role), 503 video not configured.
    """
    result = service.join(meeting_code, user, body)
    return JoinResponse(
        token=result.token,
        server_url=result.server_url,
        identity=result.participant.identity,
        role=result.participant.role,
        meeting=MeetingOut.from_model(result.meeting, settings.public_app_url),
    )


@router.post("/participants/{identity}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_meeting(
    meeting_code: MeetingCode, identity: Identity, service: ParticipantServiceDep
) -> Response:
    """Record that a participant left. Body-less so `navigator.sendBeacon` can call it."""
    service.leave(meeting_code, identity)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/participants", response_model=list[ParticipantOut])
def list_attendance(
    meeting_code: MeetingCode, user: CurrentUser, service: ParticipantServiceDep
) -> list[ParticipantOut]:
    """Attendance history (host only)."""
    return [ParticipantOut.model_validate(p) for p in service.attendance(meeting_code, user)]
