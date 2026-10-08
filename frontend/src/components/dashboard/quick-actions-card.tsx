"use client";

import { CalendarDays, Plus, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";

import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/use-meetings";
import { useStartInstantMeeting } from "@/hooks/use-start-instant-meeting";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/constants";
import { formatMeetingCode } from "@/lib/datetime";

function ActionTile({
  label,
  icon: Icon,
  onClick,
  tone = "blue",
  loading = false,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  tone?: "blue" | "orange";
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="group flex w-[88px] flex-col items-center gap-2 rounded-lg p-1 disabled:cursor-wait"
    >
      <span
        className={cn(
          "flex size-[50px] items-center justify-center rounded-[14px] text-white shadow-sm transition-colors",
          tone === "orange"
            ? "bg-zoom-orange group-hover:bg-zoom-orange-hover"
            : "bg-zoom-blue group-hover:bg-zoom-blue-hover",
        )}
      >
        {loading ? <Spinner className="size-5 text-white" /> : <Icon className="size-6" aria-hidden />}
      </span>
      <span className="text-[13px] font-semibold text-ink-muted">{label}</span>
    </button>
  );
}

/** The three primary actions (New Meeting, Join, Schedule) plus the Personal Meeting ID. */
export function QuickActionsCard() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { start, isPending } = useStartInstantMeeting();

  return (
    <Card aria-label="Quick actions" className="p-6">
      <div className="flex justify-between gap-2">
        <ActionTile label="Schedule" icon={CalendarDays} onClick={() => router.push(routes.schedule)} />
        <ActionTile label="Join" icon={Plus} onClick={() => router.push(routes.join)} />
        <ActionTile label="New Meeting" icon={Video} tone="orange" loading={isPending} onClick={() => start()} />
      </div>

      <div className="mt-8 text-center">
        <p className="text-[17px] font-semibold text-ink">Personal Meeting ID</p>
        {user ? (
          <p className="mt-1 flex items-center justify-center gap-2 text-[15px] text-ink-muted">
            {formatMeetingCode(user.personal_meeting_id)}
            <CopyButton
              iconOnly
              text={user.personal_meeting_id}
              label="Copy Personal Meeting ID"
              successMessage="Personal Meeting ID copied"
            />
          </p>
        ) : (
          <div className="mx-auto mt-2 h-5 w-32 animate-pulse rounded bg-surface-subtle" />
        )}
      </div>
    </Card>
  );
}
