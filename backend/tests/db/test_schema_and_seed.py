"""Database-level guarantees: constraints, cascades, UTC handling and seeding."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from sqlalchemy import func, inspect, select
from sqlalchemy.exc import IntegrityError, StatementError

from app.core.config import Settings
from app.core.time import utcnow
from app.db.base import Base
from app.db.seed import seed_database
from app.db.session import create_db_engine, create_session_factory
from app.domain.enums import MeetingStatus, ParticipantRole
from app.models import Meeting, Participant, User


@pytest.fixture
def session():
    engine = create_db_engine("sqlite://")
    Base.metadata.create_all(engine)
    factory = create_session_factory(engine)
    with factory() as db_session:
        yield db_session
    engine.dispose()


@pytest.fixture
def user(session):
    user = User(name="Host", email="host@example.com", personal_meeting_id="1112223334")
    session.add(user)
    session.commit()
    return user


def make_meeting(user, code="1234567890", **overrides):
    values = {
        "meeting_code": code,
        "host": user,
        "title": "Test",
        "scheduled_at": utcnow(),
        "duration_minutes": 30,
        "status": MeetingStatus.SCHEDULED,
    }
    values.update(overrides)
    return Meeting(**values)


class TestSchema:
    def test_expected_tables_and_constraints_exist(self, session):
        inspector = inspect(session.get_bind())
        assert set(inspector.get_table_names()) == {"users", "meetings", "participants"}

        meeting_fks = inspector.get_foreign_keys("meetings")
        assert meeting_fks[0]["referred_table"] == "users"
        participant_fks = {
            fk["referred_table"] for fk in inspector.get_foreign_keys("participants")
        }
        assert participant_fks == {"meetings", "users"}

        unique_names = {uc["name"] for uc in inspector.get_unique_constraints("participants")}
        assert "uq_participants_meeting_identity" in unique_names

    def test_meeting_code_is_unique(self, session, user):
        session.add(make_meeting(user, code="1234567890"))
        session.commit()
        session.add(make_meeting(user, code="1234567890"))
        with pytest.raises(IntegrityError):
            session.commit()

    def test_foreign_keys_are_enforced(self, session):
        session.add(
            Participant(
                meeting_id=999,
                identity="identity-1",
                display_name="Ghost",
                role=ParticipantRole.GUEST,
            )
        )
        with pytest.raises(IntegrityError):
            session.commit()

    def test_same_identity_cannot_join_meeting_twice(self, session, user):
        meeting = make_meeting(user)
        session.add(meeting)
        session.commit()
        for _ in range(2):
            session.add(
                Participant(
                    meeting=meeting,
                    identity="identity-1",
                    display_name="A",
                    role=ParticipantRole.GUEST,
                )
            )
        with pytest.raises(IntegrityError):
            session.commit()

    def test_duration_must_be_positive(self, session, user):
        session.add(make_meeting(user, duration_minutes=0))
        with pytest.raises(IntegrityError):
            session.commit()

    def test_deleting_meeting_cascades_to_participants(self, session, user):
        meeting = make_meeting(user)
        meeting.participants.append(
            Participant(identity="identity-1", display_name="A", role=ParticipantRole.GUEST)
        )
        session.add(meeting)
        session.commit()

        session.delete(meeting)
        session.commit()
        assert session.scalar(select(func.count(Participant.id))) == 0

    def test_status_is_stored_as_lowercase_value(self, session, user):
        session.add(make_meeting(user, status=MeetingStatus.ACTIVE))
        session.commit()
        raw = session.connection().exec_driver_sql("SELECT status FROM meetings").scalar()
        assert raw == "active"


class TestUtcDateTime:
    def test_round_trips_as_aware_utc(self, session, user):
        ist = datetime(2026, 10, 9, 15, 30, tzinfo=UTC).astimezone(
            timezone(timedelta(hours=5, minutes=30))
        )
        session.add(make_meeting(user, scheduled_at=ist))
        session.commit()
        session.expire_all()

        stored = session.scalar(select(Meeting.scheduled_at))
        assert stored == datetime(2026, 10, 9, 15, 30, tzinfo=UTC)
        assert stored.tzinfo == UTC

    def test_naive_datetimes_are_rejected(self, session, user):
        session.add(make_meeting(user, scheduled_at=datetime(2026, 10, 9, 15, 30)))
        with pytest.raises(StatementError):
            session.commit()


class TestSeed:
    def settings(self, **overrides):
        return Settings(_env_file=None, database_url="sqlite://", **overrides)

    def test_seed_creates_user_and_sample_meetings(self, session):
        seed_database(session, self.settings())

        assert session.scalar(select(func.count(User.id))) == 1
        statuses = set(session.scalars(select(Meeting.status)))
        assert statuses == {MeetingStatus.SCHEDULED, MeetingStatus.ENDED}
        assert session.scalar(select(func.count(Participant.id))) > 0

    def test_seed_is_idempotent(self, session):
        seed_database(session, self.settings())
        meetings_before = session.scalar(select(func.count(Meeting.id)))

        seed_database(session, self.settings())

        assert session.scalar(select(func.count(User.id))) == 1
        assert session.scalar(select(func.count(Meeting.id))) == meetings_before

    def test_seed_without_sample_data(self, session):
        seed_database(session, self.settings(seed_sample_data=False))
        assert session.scalar(select(func.count(User.id))) == 1
        assert session.scalar(select(func.count(Meeting.id))) == 0
