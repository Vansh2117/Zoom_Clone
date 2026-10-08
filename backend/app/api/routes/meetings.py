from fastapi import APIRouter, Response, status

from app.api.deps import CurrentUser, MeetingCode, MeetingServiceDep, SettingsDep
from app.schemas.meeting import MeetingCreate, MeetingOut

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("/instant", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def create_instant_meeting(
    user: CurrentUser, service: MeetingServiceDep, settings: SettingsDep
) -> MeetingOut:
    """'New Meeting': create a live meeting the host is about to enter."""
    meeting = service.create_instant(user)
    return MeetingOut.from_model(meeting, settings.public_app_url)


@router.post("", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def schedule_meeting(
    body: MeetingCreate, user: CurrentUser, service: MeetingServiceDep, settings: SettingsDep
) -> MeetingOut:
    meeting = service.schedule(user, body)
    return MeetingOut.from_model(meeting, settings.public_app_url)


@router.get("/upcoming", response_model=list[MeetingOut])
def list_upcoming_meetings(
    user: CurrentUser, service: MeetingServiceDep, settings: SettingsDep
) -> list[MeetingOut]:
    return [MeetingOut.from_model(m, settings.public_app_url) for m in service.list_upcoming(user)]


@router.get("/recent", response_model=list[MeetingOut])
def list_recent_meetings(
    user: CurrentUser, service: MeetingServiceDep, settings: SettingsDep
) -> list[MeetingOut]:
    return [MeetingOut.from_model(m, settings.public_app_url) for m in service.list_recent(user)]


@router.get("/{meeting_code}", response_model=MeetingOut)
def get_meeting(
    meeting_code: MeetingCode, service: MeetingServiceDep, settings: SettingsDep
) -> MeetingOut:
    """Public lookup used by the Join flow to validate a meeting ID before joining."""
    return MeetingOut.from_model(service.get(meeting_code), settings.public_app_url)


@router.post("/{meeting_code}/end", response_model=MeetingOut)
def end_meeting(
    meeting_code: MeetingCode, user: CurrentUser, service: MeetingServiceDep, settings: SettingsDep
) -> MeetingOut:
    """Host's 'End Meeting for All': marks the meeting ENDED and closes the video room."""
    return MeetingOut.from_model(service.end(meeting_code, user), settings.public_app_url)


@router.delete("/{meeting_code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_code: MeetingCode, user: CurrentUser, service: MeetingServiceDep
) -> Response:
    service.delete_scheduled(meeting_code, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
