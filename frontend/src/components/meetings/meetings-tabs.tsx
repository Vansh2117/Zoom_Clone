"use client";

import { CalendarX, Plus } from "lucide-react";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";

import { PageSpinner } from "@/components/ui/spinner";
import { QueryError } from "@/components/ui/query-error";
import { StateMessage } from "@/components/ui/state-message";
import { useRecentMeetings, useUpcomingMeetings } from "@/hooks/use-meetings";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/constants";
import type { Meeting } from "@/types/api";

import { DeleteMeetingDialog } from "./delete-meeting-dialog";
import { MeetingRow } from "./meeting-row";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "previous", label: "Previous" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** Zoom's Meetings page: Upcoming / Previous tabs with a list of meetings. */
export function MeetingsTabs() {
  const [tab, setTab] = useState<TabId>("upcoming");
  const [toDelete, setToDelete] = useState<Meeting | null>(null);
  const upcoming = useUpcomingMeetings();
  const previous = useRecentMeetings();
  const query = tab === "upcoming" ? upcoming : previous;

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const next = tab === "upcoming" ? "previous" : "upcoming";
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Meetings</h1>
        <Link
          href={routes.schedule}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-zoom-blue px-4 text-sm font-semibold text-white hover:bg-zoom-blue-hover"
        >
          <Plus className="size-4" aria-hidden />
          Schedule a Meeting
        </Link>
      </div>

      <div role="tablist" aria-label="Meeting lists" className="mt-6 flex gap-6 border-b border-line">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            onKeyDown={onTabKeyDown}
            className={cn(
              "-mb-px border-b-2 px-1 pb-3 text-[15px] font-semibold transition-colors",
              tab === id ? "border-zoom-blue text-zoom-blue" : "border-transparent text-ink-subtle hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <section id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {query.isPending ? (
          <PageSpinner label="Loading meetings…" />
        ) : query.isError ? (
          <QueryError error={query.error} onRetry={() => query.refetch()} className="py-16" />
        ) : query.data.length === 0 ? (
          <StateMessage
            className="py-16"
            icon={<CalendarX className="size-10 text-ink-subtle" aria-hidden />}
            title={tab === "upcoming" ? "No upcoming meetings" : "No previous meetings"}
            description={
              tab === "upcoming"
                ? "Schedule a meeting to get started."
                : "Meetings appear here once they have ended."
            }
          />
        ) : (
          <ul>
            {query.data.map((meeting) => (
              <MeetingRow key={meeting.meeting_code} meeting={meeting} onDelete={setToDelete} />
            ))}
          </ul>
        )}
      </section>

      <DeleteMeetingDialog meeting={toDelete} onOpenChange={(open) => !open && setToDelete(null)} />
    </div>
  );
}
