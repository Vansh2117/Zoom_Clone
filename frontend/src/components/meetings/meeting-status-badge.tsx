import { Badge } from "@/components/ui/badge";
import type { Meeting } from "@/types/api";

/** Human label for where a meeting is in its lifecycle. */
export function MeetingStatusBadge({ meeting, now = new Date() }: { meeting: Meeting; now?: Date }) {
  if (meeting.status === "active") {
    return (
      <Badge tone="live">
        <span className="size-1.5 rounded-full bg-[#0f7a3a]" aria-hidden />
        Live
      </Badge>
    );
  }
  if (meeting.status === "ended") return <Badge>Ended</Badge>;
  if (new Date(meeting.scheduled_end_at) <= now) return <Badge tone="warning">Not started</Badge>;
  return null;
}
