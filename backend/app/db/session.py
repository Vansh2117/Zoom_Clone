from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

_IN_MEMORY_URLS = {"sqlite://", "sqlite:///:memory:"}


def create_db_engine(database_url: str) -> Engine:
    """Create the SQLAlchemy engine, with the SQLite-specific settings we need."""
    is_sqlite = database_url.startswith("sqlite")
    kwargs: dict = {}

    if is_sqlite:
        # FastAPI runs sync endpoints in a thread pool, so one connection may be
        # used from a different thread than the one that created it.
        kwargs["connect_args"] = {"check_same_thread": False}
        if database_url in _IN_MEMORY_URLS:
            # One shared connection, otherwise every connection gets its own empty DB (tests).
            kwargs["poolclass"] = StaticPool

    engine = create_engine(database_url, **kwargs)

    if is_sqlite:
        _enable_sqlite_foreign_keys(engine)

    return engine


def _enable_sqlite_foreign_keys(engine: Engine) -> None:
    """SQLite ignores FOREIGN KEY constraints unless this pragma is set per connection."""

    @event.listens_for(engine, "connect")
    def _set_pragma(dbapi_connection, _connection_record) -> None:  # type: ignore[no-untyped-def]
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    # expire_on_commit=False: objects stay readable after commit (we serialise them afterwards).
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
