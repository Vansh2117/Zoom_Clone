"use client";

import { Users, Video } from "lucide-react";
import Link from "next/link";

import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import { Card } from "@/components/ui/card";
import { QueryError } from "@/components/ui/query-error";
import { StateMessage } from "@/components/ui/state-message";
import { useRecentMeetings } from "@/hooks/use-meetings";
import { routes } from "@/lib/constants";
import { formatDayLabel, formatDuration, formatMeetingCode, formatTime } from "@/lib/datetime";
import type { Meeting } from "@/types/api";

import { EmptyBoxIllustration } from "./empty-box-illustration";

const MAX_ITEMS = 5;

function RecentItem({ meeting }: { meeting: Meeting }) {
  const when = meeting.ended_at ?? meeting.scheduled_at;
  return (
    <li className="flex items-center gap-4 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zoom-blue-soft text-zoom-blue">
        <Video className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={routes.meetingDetails(meeting.meeting_code)}
          className="block truncate text-[15px] font-semibold text-ink hover:text-zoom-blue"
        >
          {meeting.title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-subtle">
          <span>
            {formatDayLabel(when)}, {formatTime(when)}
          </span>
          <span aria-hidden>·</span>
          <span>{formatDuration(meeting.duration_minutes)}</span>
          {meeting.participant_count > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1">
                <Users className="size-3.5" aria-hidden />
                {meeting.participant_count} {meeting.participant_count === 1 ? "participant" : "participants"}
              </span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>ID {formatMeetingCode(meeting.meeting_code)}</span>
        </p>
      </div>
      <MeetingStatusBadge meeting={meeting} />
    </li>
  );
}

export function RecentActivityCard() {
  const { data: meetings, isPending, isError, error, refetch } = useRecentMeetings();

  return (
    <Card aria-labelledby="recent-heading" className="p-6">
      <h2 id="recent-heading" className="border-b border-line pb-4 text-2xl font-semibold text-ink">
        Recent activity
      </h2>

      {isPending ? (
        <div className="space-y-3 pt-4" aria-label="Loading recent activity">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-12 animate-pulse rounded-lg bg-surface-subtle" />
          ))}
        </div>
      ) : isError ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : meetings.length === 0 ? (
        <StateMessage
          className="py-12"
          icon={<EmptyBoxIllustration className="mb-4 w-36" />}
          title="No recent activity"
          description="Meetings you host will appear here after they end."
        />
      ) : (
        <ul className="divide-y divide-line" aria-label="Recent meetings">
          {meetings.slice(0, MAX_ITEMS).map((meeting) => (
            <RecentItem key={meeting.meeting_code} meeting={meeting} />
          ))}
        </ul>
      )}
    </Card>
  );
}
