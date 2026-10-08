from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum
from sqlalchemy.engine import Dialect
from sqlalchemy.types import TypeDecorator


def string_enum(enum_cls: type[StrEnum], name: str) -> Enum:
    """Portable enum column: stored as VARCHAR + CHECK constraint, persisting the
    enum *values* ("active") rather than member names ("ACTIVE")."""
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=16,
        values_callable=lambda members: [member.value for member in members],
        validate_strings=True,
    )


class UTCDateTime(TypeDecorator[datetime]):
    """Store datetimes as naive UTC, always hand back timezone-aware UTC.

    SQLite has no timezone-aware datetime type: it silently drops tzinfo.
    This decorator makes the convention explicit and enforced in one place:
    * writing a naive datetime is a bug, so it raises immediately;
    * every value read back is tagged as UTC, so the API serialises it with a
      trailing "Z" and the browser can convert it to the user's local time.
    """

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("Naive datetimes are not allowed; pass a timezone-aware UTC value.")
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        return value.replace(tzinfo=UTC)
