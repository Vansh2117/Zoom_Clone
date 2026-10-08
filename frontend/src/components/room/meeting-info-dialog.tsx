"use client";

import { CopyButton } from "@/components/ui/copy-button";
import { Dialog } from "@/components/ui/dialog";
import { formatMeetingCode } from "@/lib/datetime";
import type { Meeting } from "@/types/api";

/** The (i) popup in Zoom's meeting window: ID, host and the invite link. */
export function MeetingInfoDialog({
  meeting,
  open,
  onOpenChange,
}: {
  meeting: Meeting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} tone="dark" title={meeting.title}>
      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-3 text-sm">
        <dt className="text-room-muted">Meeting ID</dt>
        <dd>{formatMeetingCode(meeting.meeting_code)}</dd>
        <dt className="text-room-muted">Host</dt>
        <dd>{meeting.host.name}</dd>
        <dt className="text-room-muted">Invite Link</dt>
        <dd className="min-w-0">
          <span className="block break-all">{meeting.invite_url}</span>
          <CopyButton text={meeting.invite_url} label="Copy Link" successMessage="Invite link copied" className="mt-1" />
        </dd>
      </dl>
    </Dialog>
  );
}
