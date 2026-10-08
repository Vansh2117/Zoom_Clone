"""Application factory.

`create_app` builds a fully wired app from a `Settings` object. Production uses
the module-level `app`; tests call `create_app` with an in-memory database and
a fake video service, so no global state leaks between them.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models as _models  # noqa: F401  (registers every table on Base.metadata)
from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.error_handlers import register_exception_handlers
from app.db.base import Base
from app.db.seed import seed_database
from app.db.session import create_db_engine, create_session_factory
from app.services.video import LiveKitVideoService, VideoService

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


def create_app(
    settings: Settings | None = None, video_service: VideoService | None = None
) -> FastAPI:
    settings = settings or get_settings()
    engine = create_db_engine(settings.database_url)
    session_factory = create_session_factory(engine)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        # Schema is small and young, so create_all is enough; Alembic would be
        # the next step once the schema has to evolve with production data.
        Base.metadata.create_all(engine)
        with session_factory() as session:
            seed_database(session, settings)
        yield
        engine.dispose()

    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="Backend for a Zoom-style video conferencing app.",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.session_factory = session_factory
    app.state.video_service = video_service or LiveKitVideoService(settings)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type"],
    )
    register_exception_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
