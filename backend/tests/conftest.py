"""Shared fixtures.

Every test gets a brand-new app backed by an in-memory SQLite database and a
fake video service, so tests are isolated, fast and need no network/LiveKit.
"""

from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.main import create_app
from tests.fakes import FakeVideoService


@pytest.fixture
def settings() -> Settings:
    return Settings(
        _env_file=None,  # never read a developer's local .env during tests
        database_url="sqlite://",
        public_app_url="http://app.test",
        seed_sample_data=False,
    )


@pytest.fixture
def video() -> FakeVideoService:
    return FakeVideoService()


@pytest.fixture
def app(settings: Settings, video: FakeVideoService) -> FastAPI:
    return create_app(settings, video)


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app) as test_client:  # `with` runs startup: create tables + seed user
        yield test_client


@pytest.fixture
def db(app: FastAPI, client: TestClient) -> Iterator[Session]:
    session: Session = app.state.session_factory()
    yield session
    session.close()
