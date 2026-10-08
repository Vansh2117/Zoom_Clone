from fastapi import APIRouter, Response, status

from app.api.deps import CurrentUser, HostControlServiceDep, MeetingCode
from app.schemas.participant import RemoveParticipantRequest

router = APIRouter(prefix="/meetings/{meeting_code}/host", tags=["host controls"])


@router.post("/mute-all", status_code=status.HTTP_204_NO_CONTENT)
def mute_all(
    meeting_code: MeetingCode, user: CurrentUser, service: HostControlServiceDep
) -> Response:
    service.mute_all(meeting_code, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/remove", status_code=status.HTTP_204_NO_CONTENT)
def remove_participant(
    meeting_code: MeetingCode,
    body: RemoveParticipantRequest,
    user: CurrentUser,
    service: HostControlServiceDep,
) -> Response:
    service.remove_participant(meeting_code, user, body.identity)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
