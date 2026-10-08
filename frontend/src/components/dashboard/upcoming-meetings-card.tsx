"use client";

import Link from "next/link";
import { useState } from "react";

import { TestAudioVideoDialog } from "@/components/media/test-audio-video-dialog";
import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import { StartMeetingButton } from "@/components/meetings/start-meeting-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { QueryError } from "@/components/ui/query-error";
import { useUpcomingMeetings } from "@/hooks/use-meetings";
import { routes } from "@/lib/constants";
import { formatDayLabel, formatTimeRange } from "@/lib/datetime";
import type { Meeting } from "@/types/api";

const MAX_ITEMS = 4;

function UpcomingItem({ meeting }: { meeting: Meeting }) {
  return (
    <li className="rounded-lg bg-surface-subtle p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] text-ink-subtle">
            {meeting.status === "active"
              ? "In progress"
              : `${formatDayLabel(meeting.scheduled_at)}, ${formatTimeRange(meeting.scheduled_at, meeting.scheduled_end_at)}`}
          </p>
          <Link
            href={routes.meetingDetails(meeting.meeting_code)}
            className="mt-0.5 block truncate text-[15px] font-semibold text-ink hover:text-zoom-blue"
          >
            {meeting.title}
          </Link>
        </div>
        <MeetingStatusBadge meeting={meeting} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <CopyButton text={meeting.invite_url} label="Copy link" successMessage="Invite link copied" />
        <StartMeetingButton meeting={meeting} />
      </div>
    </li>
  );
}

/** Right-hand "Meetings" card on the home page: the next few upcoming meetings. */
export function UpcomingMeetingsCard() {
  const [testOpen, setTestOpen] = useState(false);
  const { data: meetings, isPending, isError, error, refetch } = useUpcomingMeetings();

  return (
    <Card aria-labelledby="upcoming-heading" className="p-6">
      <div className="flex items-baseline justify-between">
        <h2 id="upcoming-heading" className="text-2xl font-semibold text-ink">
          Meetings
        </h2>
        <Link href={routes.meetings} className="text-[15px] text-zoom-blue hover:underline">
          Visit Meetings
        </Link>
      </div>

      <div className="mt-5">
        {isPending ? (
          <div className="space-y-2" aria-label="Loading upcoming meetings">
            <div className="h-20 animate-pulse rounded-lg bg-surface-subtle" />
            <div className="h-20 animate-pulse rounded-lg bg-surface-subtle" />
          </div>
        ) : isError ? (
          <QueryError error={error} onRetry={() => refetch()} className="py-4" />
        ) : meetings.length === 0 ? (
          <div className="rounded-lg bg-surface-subtle px-3 py-3">
            <p className="text-[17px] font-semibold text-ink">No Upcoming Meetings</p>
            <p className="mt-1 text-[13px] text-ink-subtle">
              <Link href={routes.schedule} className="text-zoom-blue hover:underline">
                Schedule a meeting
              </Link>{" "}
              to see it here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Upcoming meetings">
            {meetings.slice(0, MAX_ITEMS).map((meeting) => (
              <UpcomingItem key={meeting.meeting_code} meeting={meeting} />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 flex justify-center">
        <Button variant="soft" onClick={() => setTestOpen(true)}>
          Test Audio and Video
        </Button>
      </div>
      <TestAudioVideoDialog open={testOpen} onOpenChange={setTestOpen} />
    </Card>
  );
}
