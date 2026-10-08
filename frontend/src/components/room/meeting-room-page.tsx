"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CircleSlash, LogOut, WifiOff } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { queryKeys } from "@/hooks/use-meetings";
import { useMeetingConnection } from "@/hooks/use-meeting-connection";
import { routes } from "@/lib/constants";
import { getErrorMessage, hasErrorCode } from "@/lib/errors";

import { FullScreenNotice } from "./full-screen-notice";
import type { ExitReason } from "./live-room";
import { WaitingForHost } from "./waiting-for-host";

// LiveKit touches browser-only APIs (WebRTC, media devices), so it is never server-rendered.
const LiveRoom = dynamic(() => import("./live-room").then((module) => module.LiveRoom), {
  ssr: false,
  loading: () => <ConnectingScreen />,
});

function ConnectingScreen() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-room">
      <Spinner label="Joining meeting…" className="text-white" />
    </main>
  );
}

const homeLink = (
  <Link href={routes.home} className="rounded-lg bg-zoom-blue px-4 py-2 font-semibold text-white hover:bg-zoom-blue-hover">
    Back to Home
  </Link>
);

/** Exits that keep the user on this page (the others navigate home). */
type ExitScreen = Exclude<ExitReason, "left" | "ended-by-me">;

const EXIT_SCREENS: Record<Exclude<ExitScreen, "disconnected">, { title: string; description: string }> = {
  "ended-by-host": {
    title: "This meeting has been ended by the host",
    description: "Thanks for joining. You can close this tab or return home.",
  },
  removed: {
    title: "You have been removed from this meeting",
    description: "The host removed you from the meeting.",
  },
  duplicate: {
    title: "You joined this meeting from another window",
    description: "Only one window per participant can be in the meeting at a time.",
  },
};

/** /meeting/[code]: connect, wait for the host, show the room, then the exit screen. */
export function MeetingRoomPage({ code }: { code: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { phase, retry } = useMeetingConnection(code);
  const [exit, setExit] = useState<ExitScreen | null>(null);

  const handleExit = useCallback(
    (reason: ExitReason) => {
      // Dashboard lists may have changed (meeting ended, attendance updated).
      void queryClient.invalidateQueries({ queryKey: queryKeys.upcoming });
      void queryClient.invalidateQueries({ queryKey: queryKeys.recent });
      void queryClient.invalidateQueries({ queryKey: queryKeys.meeting(code) });

      if (reason === "left" || reason === "ended-by-me") {
        toast.success(reason === "left" ? "You left the meeting" : "Meeting ended for all participants");
        router.push(routes.home);
        return;
      }
      setExit(reason);
    },
    [code, queryClient, router],
  );

  if (exit === "disconnected") {
    return (
      <FullScreenNotice
        icon={<WifiOff className="size-10 text-room-muted" aria-hidden />}
        title="You've been disconnected"
        description="We couldn't reconnect you to the meeting. Check your internet connection and rejoin."
        actions={
          <>
            <Button
              onClick={() => {
                setExit(null);
                void retry();
              }}
            >
              Rejoin
            </Button>
            {homeLink}
          </>
        }
      />
    );
  }
  if (exit) {
    const screen = EXIT_SCREENS[exit];
    return (
      <FullScreenNotice
        icon={<LogOut className="size-10 text-room-muted" aria-hidden />}
        title={screen.title}
        description={screen.description}
        actions={homeLink}
      />
    );
  }

  switch (phase.kind) {
    case "joining":
      return <ConnectingScreen />;
    case "waiting-for-host":
      return <WaitingForHost code={code} onHostStarted={retry} />;
    case "failed":
      return (
        <FullScreenNotice
          icon={<CircleSlash className="size-10 text-room-muted" aria-hidden />}
          title={
            hasErrorCode(phase.error, "MEETING_ENDED")
              ? "This meeting has been ended by the host"
              : hasErrorCode(phase.error, "MEETING_NOT_FOUND")
                ? "This meeting ID is not valid"
                : "Unable to join this meeting"
          }
          description={
            hasErrorCode(phase.error, "MEETING_ENDED") || hasErrorCode(phase.error, "MEETING_NOT_FOUND")
              ? undefined
              : getErrorMessage(phase.error)
          }
          actions={
            <>
              {hasErrorCode(phase.error, "NETWORK_ERROR") && <Button onClick={() => void retry()}>Try again</Button>}
              {homeLink}
            </>
          }
        />
      );
    case "ready":
      return <LiveRoom join={phase.join} session={phase.session} onExit={handleExit} />;
  }
}
