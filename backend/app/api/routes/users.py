from fastapi import APIRouter

from app.api.deps import CurrentUser
from app.schemas.user import UserOut

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(user: CurrentUser) -> UserOut:
    """Profile of the (default) logged-in user, shown on the dashboard."""
    return UserOut.model_validate(user)
