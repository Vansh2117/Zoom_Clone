"use client";

import { useRouter } from "next/navigation";

import { Button, type ButtonProps } from "@/components/ui/button";
import { routes } from "@/lib/constants";
import type { Meeting } from "@/types/api";

/** Host's entry point: "Start" a scheduled meeting or re-"Join" a live one, via the pre-join screen. */
export function StartMeetingButton({
  meeting,
  size = "sm",
  className,
}: {
  meeting: Meeting;
  size?: ButtonProps["size"];
  className?: string;
}) {
  const router = useRouter();
  if (meeting.status === "ended") return null;

  const label = meeting.status === "active" ? "Join" : "Start";
  return (
    <Button
      size={size}
      className={className}
      aria-label={`${label} ${meeting.title}`}
      onClick={() => router.push(routes.preJoin(meeting.meeting_code, { host: true }))}
    >
      {label}
    </Button>
  );
}
