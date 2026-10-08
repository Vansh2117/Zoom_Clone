from fastapi import APIRouter

from app.api.deps import VideoDep

router = APIRouter(tags=["health"])


@router.get("/health")
def health(video: VideoDep) -> dict[str, str | bool]:
    """Liveness probe for the hosting platform; also shows whether video is configured."""
    return {"status": "ok", "video_configured": video.is_configured}
