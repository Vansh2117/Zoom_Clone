"use client";

import { Trash2, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { routes } from "@/lib/constants";
import { formatDayLabel, formatDuration, formatMeetingCode, formatTimeRange } from "@/lib/datetime";
import { buildInvitationText } from "@/lib/invitation";
import type { Meeting } from "@/types/api";

import { MeetingStatusBadge } from "./meeting-status-badge";
import { StartMeetingButton } from "./start-meeting-button";

/** One meeting in the Meetings list (Zoom layout: when | what | actions). */
export function MeetingRow({ meeting, onDelete }: { meeting: Meeting; onDelete?: (meeting: Meeting) => void }) {
  const isPrevious = meeting.status === "ended" || new Date(meeting.scheduled_end_at) <= new Date();

  return (
    <li className="grid gap-3 border-b border-line py-5 md:grid-cols-[200px_minmax(0,1fr)_auto] md:items-center md:gap-6">
      <div className="text-sm text-ink-muted">
        <p className="font-semibold text-ink">{formatDayLabel(meeting.scheduled_at)}</p>
        <p>
          {meeting.status === "active" && !isPrevious
            ? "In progress"
            : formatTimeRange(meeting.scheduled_at, meeting.scheduled_end_at)}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={routes.meetingDetails(meeting.meeting_code)}
            className="truncate text-[15px] font-semibold text-ink hover:text-zoom-blue"
          >
            {meeting.title}
          </Link>
          <MeetingStatusBadge meeting={meeting} />
        </div>
        <p className="mt-1 flex flex-wrap gap-x-3 text-[13px] text-ink-subtle">
          <span>Meeting ID: {formatMeetingCode(meeting.meeting_code)}</span>
          <span>{formatDuration(meeting.duration_minutes)}</span>
          {meeting.participant_count > 0 && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" aria-hidden />
              {meeting.participant_count}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {meeting.status !== "ended" && (
          <>
            <StartMeetingButton meeting={meeting} />
            <CopyButton
              variant="secondary"
              text={buildInvitationText(meeting)}
              label="Copy Invitation"
              successMessage="Meeting invitation copied"
            />
          </>
        )}
        {meeting.status === "scheduled" && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${meeting.title}`}
            title="Delete"
            onClick={() => onDelete(meeting)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </li>
  );
}
