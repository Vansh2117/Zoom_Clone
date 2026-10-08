from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utcnow
from app.db.base import Base
from app.db.types import UTCDateTime

if TYPE_CHECKING:
    from app.models.meeting import Meeting


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        # Named explicitly: the "uq" naming convention needs a constraint name,
        # which a bare `unique=True` on the column does not provide.
        UniqueConstraint("email", name="email"),
        UniqueConstraint("personal_meeting_id", name="personal_meeting_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255))
    # Zoom's "Personal Meeting ID" shown on the dashboard.
    personal_meeting_id: Mapped[str] = mapped_column(String(11))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)

    hosted_meetings: Mapped[list[Meeting]] = relationship(
        back_populates="host", cascade="all, delete-orphan", passive_deletes=True
    )

    def __repr__(self) -> str:
        return f"User(id={self.id!r}, email={self.email!r})"
