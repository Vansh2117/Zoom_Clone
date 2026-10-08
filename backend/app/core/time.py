from datetime import UTC, datetime


def utcnow() -> datetime:
    """Timezone-aware current time in UTC. The whole backend works in UTC only."""
    return datetime.now(UTC)
