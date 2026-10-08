"use client";

import { useParticipants, useTrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";
import { MessageSquare, Mic, MicOff, MonitorUp, Users, Video, VideoOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ControlButton, CountBadge } from "./control-button";

export type SidePanel = "participants" | "chat" | null;

function onDeviceError(kind: string) {
  return (error: Error) => {
    const blocked = error.name === "NotAllowedError";
    toast.error(
      blocked
        ? `${kind} access is blocked. Allow it in your browser's site settings and try again.`
        : `Couldn't start your ${kind.toLowerCase()}.`,
    );
  };
}

const MIC_ERROR = onDeviceError("Microphone");
const CAMERA_ERROR = onDeviceError("Camera");
const SHARE_ERROR = onDeviceError("Screen share");

/** Zoom's bottom toolbar: mute, video, participants, chat, share, leave/end. */
export function ControlBar({
  panel,
  onTogglePanel,
  unreadMessages,
  isHost,
  onLeaveClick,
}: {
  panel: SidePanel;
  onTogglePanel: (panel: Exclude<SidePanel, null>) => void;
  unreadMessages: number;
  isHost: boolean;
  onLeaveClick: () => void;
}) {
  const participants = useParticipants();
  const mic = useTrackToggle({ source: Track.Source.Microphone, onDeviceError: MIC_ERROR });
  const camera = useTrackToggle({ source: Track.Source.Camera, onDeviceError: CAMERA_ERROR });
  const screen = useTrackToggle({ source: Track.Source.ScreenShare, onDeviceError: SHARE_ERROR });

  // Screen sharing is unavailable on most mobile browsers; hide rather than fail.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getDisplayMedia === "function");
  }, []);

  // Zoom's keyboard shortcuts: Alt+A (audio) and Alt+V (video).
  const { toggle: toggleMic } = mic;
  const { toggle: toggleCamera } = camera;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "a" || event.code === "KeyA") {
        event.preventDefault();
        void toggleMic();
      } else if (key === "v" || event.code === "KeyV") {
        event.preventDefault();
        void toggleCamera();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleMic, toggleCamera]);

  return (
    <footer
      aria-label="Meeting controls"
      className="flex shrink-0 items-center justify-between gap-1 bg-room-bar px-2 py-1.5 md:px-4"
    >
      <div className="flex items-center gap-0.5">
        <ControlButton
          icon={mic.enabled ? Mic : MicOff}
          label={mic.enabled ? "Mute" : "Unmute"}
          off={!mic.enabled}
          pressed={!mic.enabled}
          disabled={mic.pending}
          shortcut="Alt+A"
          onClick={() => void mic.toggle()}
        />
        <ControlButton
          icon={camera.enabled ? Video : VideoOff}
          label={camera.enabled ? "Stop Video" : "Start Video"}
          off={!camera.enabled}
          pressed={!camera.enabled}
          disabled={camera.pending}
          shortcut="Alt+V"
          onClick={() => void camera.toggle()}
        />
      </div>

      <div className="flex items-center gap-0.5">
        <ControlButton
          icon={Users}
          label="Participants"
          active={panel === "participants"}
          pressed={panel === "participants"}
          badge={<span className="absolute -top-1 -right-3 text-[10px] text-room-muted">{participants.length}</span>}
          onClick={() => onTogglePanel("participants")}
        />
        <ControlButton
          icon={MessageSquare}
          label="Chat"
          active={panel === "chat"}
          pressed={panel === "chat"}
          badge={<CountBadge count={unreadMessages} />}
          onClick={() => onTogglePanel("chat")}
        />
        {canShare && (
          <ControlButton
            icon={MonitorUp}
            label={screen.enabled ? "Stop Share" : "Share"}
            tone="share"
            pressed={screen.enabled}
            disabled={screen.pending}
            onClick={() => void screen.toggle()}
          />
        )}
      </div>

      <Button variant="danger" onClick={onLeaveClick} className="px-4">
        {isHost ? "End" : "Leave"}
      </Button>
    </footer>
  );
}
