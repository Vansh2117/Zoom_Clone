"use client";

import {
  VideoTrack,
  isTrackReference,
  useIsMuted,
  useIsSpeaking,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { MicOff } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { getParticipantRole } from "@/lib/participant";

/** One video tile: live video, or the participant's initials when their camera is off. */
export function ParticipantTile({ trackRef, className }: { trackRef: TrackReferenceOrPlaceholder; className?: string }) {
  const { participant } = trackRef;
  const isScreenShare = trackRef.source === Track.Source.ScreenShare;
  const videoMuted = useIsMuted(trackRef);
  const micMuted = useIsMuted({ participant, source: Track.Source.Microphone });
  const speaking = useIsSpeaking(participant);

  const showVideo = isTrackReference(trackRef) && !videoMuted;
  const name = participant.name || participant.identity;
  const isHost = getParticipantRole(participant.metadata) === "host";
  const tags = [isHost && "Host", participant.isLocal && "You"].filter(Boolean).join(", ");

  return (
    <div
      className={cn(
        "relative flex min-h-0 items-center justify-center overflow-hidden rounded-lg bg-room-tile",
        speaking && !isScreenShare && "ring-[3px] ring-speaking ring-inset",
        className,
      )}
    >
      {showVideo ? (
        <VideoTrack
          trackRef={trackRef}
          className={cn(
            "h-full w-full",
            isScreenShare ? "object-contain" : "object-cover",
            participant.isLocal && !isScreenShare && "video-mirror",
          )}
        />
      ) : (
        <Avatar name={name} className="size-[22%] max-h-28 min-h-12 max-w-28 min-w-12 rounded-2xl text-[clamp(1rem,3vw,2.5rem)]" />
      )}

      <span className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {!isScreenShare && micMuted && <MicOff className="size-3.5 shrink-0 text-danger" aria-label="Muted" />}
        <span className="truncate">
          {isScreenShare ? `${name}'s screen` : name}
          {tags && !isScreenShare && <span className="text-white/70"> ({tags})</span>}
        </span>
      </span>
    </div>
  );
}
