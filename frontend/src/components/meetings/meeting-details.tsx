"use client";

import { ChevronLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { PageSpinner } from "@/components/ui/spinner";
import { QueryError } from "@/components/ui/query-error";
import { StateMessage } from "@/components/ui/state-message";
import { useAttendance, useMeeting } from "@/hooks/use-meetings";
import { routes } from "@/lib/constants";
import { formatDuration, formatFullDateTime, formatMeetingCode, formatTime, getTimezoneLabel } from "@/lib/datetime";
import { hasErrorCode } from "@/lib/errors";
import { buildInvitationText } from "@/lib/invitation";
import type { Meeting } from "@/types/api";

import { DeleteMeetingDialog } from "./delete-meeting-dialog";
import { MeetingStatusBadge } from "./meeting-status-badge";
import { StartMeetingButton } from "./start-meeting-button";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-4 md:grid-cols-[170px_1fr] md:gap-4">
      <dt className="text-[15px] text-ink-subtle">{label}</dt>
      <dd className="min-w-0 text-[15px] text-ink">{children}</dd>
    </div>
  );
}

function Attendance({ meeting }: { meeting: Meeting }) {
  const { data, isPending, isError, error, refetch } = useAttendance(meeting.meeting_code, true);
  if (isPending) return <PageSpinner label="Loading attendance…" />;
  if (isError) return <QueryError error={error} onRetry={() => refetch()} />;
  if (data.length === 0) return <p className="py-4 text-sm text-ink-subtle">Nobody joined this meeting.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <caption className="sr-only">Participants who joined this meeting</caption>
        <thead className="border-b border-line text-ink-subtle">
          <tr>
            <th scope="col" className="py-2 font-medium">Name</th>
            <th scope="col" className="py-2 font-medium">Role</th>
            <th scope="col" className="py-2 font-medium">Joined</th>
            <th scope="col" className="py-2 font-medium">Left</th>
          </tr>
        </thead>
        <tbody>
          {data.map((participant) => (
            <tr key={participant.identity} className="border-b border-line last:border-0">
              <td className="py-2.5 font-medium">{participant.display_name}</td>
              <td className="py-2.5 capitalize">{participant.role}</td>
              <td className="py-2.5">{formatTime(participant.joined_at)}</td>
              <td className="py-2.5">{participant.left_at ? formatTime(participant.left_at) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MeetingDetails({ code }: { code: string }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);
  const { data: meeting, isPending, isError, error, refetch } = useMeeting(code);

  const backLink = (
    <Link href={routes.meetings} className="inline-flex items-center gap-1 text-[15px] text-zoom-blue hover:underline">
      <ChevronLeft className="size-4" aria-hidden />
      Back to Meetings
    </Link>
  );

  if (isPending) return <PageSpinner />;
  if (isError) {
    return (
      <div className="mx-auto max-w-[1080px]">
        {backLink}
        {hasErrorCode(error, "MEETING_NOT_FOUND") ? (
          <StateMessage
            className="py-16"
            icon={<SearchX className="size-10 text-ink-subtle" aria-hidden />}
            title="Meeting not found"
            description="It may have been deleted, or the link is incorrect."
          />
        ) : (
          <QueryError error={error} onRetry={() => refetch()} className="py-16" />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1080px]">
      {backLink}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-ink">{meeting.title}</h1>
        <MeetingStatusBadge meeting={meeting} />
      </div>

      <dl className="mt-6">
        <DetailRow label="Topic">{meeting.title}</DetailRow>
        {meeting.description && (
          <DetailRow label="Description">
            <p className="whitespace-pre-line">{meeting.description}</p>
          </DetailRow>
        )}
        <DetailRow label="Time">
          {formatFullDateTime(meeting.scheduled_at)} <span className="text-ink-subtle">{getTimezoneLabel()}</span>
        </DetailRow>
        <DetailRow label="Duration">{formatDuration(meeting.duration_minutes)}</DetailRow>
        <DetailRow label="Meeting ID">{formatMeetingCode(meeting.meeting_code)}</DetailRow>
        <DetailRow label="Host">{meeting.host.name}</DetailRow>
        {meeting.status !== "ended" && (
          <DetailRow label="Invite Link">
            <div className="flex flex-wrap items-center gap-3">
              <a href={meeting.invite_url} className="break-all text-zoom-blue hover:underline">
                {meeting.invite_url}
              </a>
              <CopyButton
                variant="soft"
                text={buildInvitationText(meeting)}
                label="Copy Invitation"
                successMessage="Meeting invitation copied"
              />
            </div>
          </DetailRow>
        )}
        {meeting.ended_at && <DetailRow label="Ended">{formatFullDateTime(meeting.ended_at)}</DetailRow>}
      </dl>

      {meeting.status !== "ended" && (
        <div className="mt-8 flex flex-wrap gap-2">
          <StartMeetingButton meeting={meeting} size="md" />
          {meeting.status === "scheduled" && (
            <Button variant="secondary" onClick={() => setDeleteTarget(meeting)}>
              Delete
            </Button>
          )}
        </div>
      )}

      {meeting.status !== "scheduled" && (
        <section aria-labelledby="attendance-heading" className="mt-10">
          <h2 id="attendance-heading" className="mb-2 text-lg font-semibold text-ink">
            Participants
          </h2>
          <Attendance meeting={meeting} />
        </section>
      )}

      <DeleteMeetingDialog
        meeting={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={() => router.push(routes.meetings)}
      />
    </div>
  );
}
