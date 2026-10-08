"use client";

import { useChat, useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Info, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import type { Meeting } from "@/types/api";

import { ChatPanel } from "./chat-panel";
import { ControlBar, type SidePanel } from "./control-bar";
import { LeaveMeetingDialog } from "./leave-meeting-dialog";
import { MeetingInfoDialog } from "./meeting-info-dialog";
import { ParticipantsPanel } from "./participants-panel";
import { VideoStage } from "./video-stage";

/** Everything visible inside a connected meeting (must render inside <LiveKitRoom>). */
export function MeetingLayout({
  meeting,
  isHost,
  onLeave,
  onEndForAll,
}: {
  meeting: Meeting;
  isHost: boolean;
  onLeave: () => Promise<void>;
  onEndForAll: () => Promise<void>;
}) {
  const connectionState = useConnectionState();
  const [panel, setPanel] = useState<SidePanel>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Chat state lives here (not in the panel) so messages are kept while the panel is closed.
  const { chatMessages, send, isSending } = useChat();
  const [seenMessages, setSeenMessages] = useState(0);
  useEffect(() => {
    if (panel === "chat") setSeenMessages(chatMessages.length);
  }, [panel, chatMessages.length]);
  const unread = panel === "chat" ? 0 : chatMessages.length - seenMessages;

  const togglePanel = (next: Exclude<SidePanel, null>) => setPanel((current) => (current === next ? null : next));

  const runExit = async (action: () => Promise<void>) => {
    setExiting(true);
    try {
      await action();
    } finally {
      setExiting(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-room text-room-text">
      <header className="flex h-11 shrink-0 items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-speaking" aria-label="Encrypted connection" />
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            aria-label="Meeting information"
            className="rounded p-1 text-room-muted hover:bg-room-hover hover:text-room-text"
          >
            <Info className="size-4" aria-hidden />
          </button>
          <h1 className="truncate text-sm font-medium">{meeting.title}</h1>
        </div>
      </header>

      {connectionState === ConnectionState.Reconnecting && (
        <div role="status" className="flex items-center justify-center gap-2 bg-[#5c4a00] px-3 py-1.5 text-sm text-yellow-100">
          <Spinner className="size-4" /> Your connection was interrupted. Reconnecting…
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          {connectionState === ConnectionState.Connecting ? (
            <div className="flex h-full items-center justify-center">
              <Spinner label="Connecting to the meeting…" className="text-white" />
            </div>
          ) : (
            <VideoStage />
          )}
        </div>

        {panel && (
          <aside className="absolute inset-0 z-20 bg-room-panel md:static md:z-auto md:w-[320px] md:shrink-0 md:border-l md:border-room-hover">
            {panel === "participants" ? (
              <ParticipantsPanel
                code={meeting.meeting_code}
                inviteUrl={meeting.invite_url}
                isHost={isHost}
                onClose={() => setPanel(null)}
              />
            ) : (
              <ChatPanel messages={chatMessages} onSend={send} isSending={isSending} onClose={() => setPanel(null)} />
            )}
          </aside>
        )}
      </div>

      <ControlBar
        panel={panel}
        onTogglePanel={togglePanel}
        unreadMessages={Math.max(0, unread)}
        isHost={isHost}
        onLeaveClick={() => setLeaveOpen(true)}
      />

      <LeaveMeetingDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        isHost={isHost}
        pending={exiting}
        onLeave={() => void runExit(onLeave)}
        onEndForAll={() => void runExit(onEndForAll)}
      />
      <MeetingInfoDialog meeting={meeting} open={infoOpen} onOpenChange={setInfoOpen} />
    </div>
  );
}
