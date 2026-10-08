"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Spinner } from "@/components/ui/spinner";
import { useMeeting } from "@/hooks/use-meetings";
import { WAITING_ROOM_POLL_MS, routes } from "@/lib/constants";
import { formatFullDateTime } from "@/lib/datetime";

import { FullScreenNotice } from "./full-screen-notice";

/**
 * Zoom's "Waiting for the host to start this meeting" screen. Polls the backend
 * and joins automatically once the meeting becomes active.
 */
export function WaitingForHost({ code, onHostStarted }: { code: string; onHostStarted: () => void }) {
  const { data: meeting } = useMeeting(code, { refetchInterval: WAITING_ROOM_POLL_MS });

  useEffect(() => {
    if (meeting?.status === "active") onHostStarted();
  }, [meeting?.status, onHostStarted]);

  if (meeting?.status === "ended") {
    return (
      <FullScreenNotice
        title="This meeting has been ended by the host"
        actions={
          <Link href={routes.home} className="rounded-lg bg-zoom-blue px-4 py-2 font-semibold text-white">
            Back to Home
          </Link>
        }
      />
    );
  }

  return (
    <FullScreenNotice
      icon={<Clock className="size-10 text-room-muted" aria-hidden />}
      title="Waiting for the host to start this meeting"
      description={
        meeting
          ? `${meeting.title}${meeting.is_instant ? "" : ` · ${formatFullDateTime(meeting.scheduled_at)}`}`
          : undefined
      }
      actions={
        <Link href={routes.home} className="rounded-lg border border-room-hover px-4 py-2 text-sm hover:bg-room-hover">
          Leave
        </Link>
      }
    >
      <span role="status" className="flex items-center gap-2 text-sm text-room-muted">
        <Spinner className="size-4" /> You&apos;ll join automatically when the host starts the meeting.
      </span>
    </FullScreenNotice>
  );
}
