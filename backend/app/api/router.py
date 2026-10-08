from fastapi import APIRouter

from app.api.routes import health, host_controls, meetings, participants, users

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(users.router)
api_router.include_router(meetings.router)
api_router.include_router(participants.router)
api_router.include_router(host_controls.router)
