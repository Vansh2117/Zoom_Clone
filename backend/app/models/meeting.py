from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utcnow
from app.db.base import Base
from app.db.types import UTCDateTime, string_enum
from app.domain.enums import MeetingStatus
from app.domain.lifecycle import scheduled_end

if TYPE_CHECKING:
    from app.models.participant import Participant
    from app.models.user import User


class Meeting(Base):
    __tablename__ = "meetings"
    __table_args__ = (
        CheckConstraint("duration_minutes > 0", name="duration_positive"),
        # Serves the dashboard queries: "this host's meetings, by status, by time".
        Index("ix_meetings_host_status_scheduled", "host_id", "status", "scheduled_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # Public identifier used in URLs and shared with invitees. The integer `id`
    # stays internal so it is never guessable from the outside.
    meeting_code: Mapped[str] = mapped_column(String(11), unique=True, index=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, default=None)
    scheduled_at: Mapped[datetime] = mapped_column(UTCDateTime)
    duration_minutes: Mapped[int] = mapped_column(Integer)
    is_instant: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[MeetingStatus] = mapped_column(
        string_enum(MeetingStatus, "meeting_status"), default=MeetingStatus.SCHEDULED
    )

    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    started_at: Mapped[datetime | None] = mapped_column(UTCDateTime, default=None)
    ended_at: Mapped[datetime | None] = mapped_column(UTCDateTime, default=None)

    host: Mapped[User] = relationship(back_populates="hosted_meetings")
    participants: Mapped[list[Participant]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Participant.joined_at",
    )

    @property
    def scheduled_end_at(self) -> datetime:
        return scheduled_end(self)

    @property
    def participant_count(self) -> int:
        return len(self.participants)

    def __repr__(self) -> str:
        return f"Meeting(code={self.meeting_code!r}, status={self.status.value!r})"
