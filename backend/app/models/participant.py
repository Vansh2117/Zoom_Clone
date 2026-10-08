from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utcnow
from app.db.base import Base
from app.db.types import UTCDateTime, string_enum
from app.domain.enums import ParticipantRole

if TYPE_CHECKING:
    from app.models.meeting import Meeting
    from app.models.user import User


class Participant(Base):
    """Attendance record: who joined a meeting, as what, and when.

    The video SDK owns *live* presence (who is connected right now); this
    table is the durable history used for "Recent meetings" and attendance.
    """

    __tablename__ = "participants"
    __table_args__ = (
        # One row per browser session per meeting: a page refresh re-uses the
        # same identity, so rejoining updates the row instead of duplicating it.
        UniqueConstraint("meeting_id", "identity", name="meeting_identity"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), index=True
    )
    # Guests are not registered users, so this is nullable.
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), default=None
    )
    # The identity used inside the video room (stable per browser tab).
    identity: Mapped[str] = mapped_column(String(64))
    display_name: Mapped[str] = mapped_column(String(50))
    role: Mapped[ParticipantRole] = mapped_column(string_enum(ParticipantRole, "participant_role"))
    joined_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    left_at: Mapped[datetime | None] = mapped_column(UTCDateTime, default=None)

    meeting: Mapped[Meeting] = relationship(back_populates="participants")
    user: Mapped[User | None] = relationship()

    @property
    def is_present(self) -> bool:
        return self.left_at is None

    def __repr__(self) -> str:
        return f"Participant(identity={self.identity!r}, role={self.role.value!r})"
