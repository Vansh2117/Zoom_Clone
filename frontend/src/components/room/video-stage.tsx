"use client";

import { isTrackReference, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { galleryColumns } from "@/lib/participant";

import { ParticipantTile } from "./participant-tile";

/**
 * Gallery view of everyone's camera. When someone shares their screen it takes
 * the main stage and cameras move to a filmstrip, like Zoom's share layout.
 * If several people share at once, each viewer picks which screen to watch.
 */
export function VideoStage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  // Which shared screen this viewer is watching, when more than one person is sharing.
  const [selectedSharer, setSelectedSharer] = useState<string | null>(null);

  const screenShares = tracks.filter(
    (track) => track.source === Track.Source.ScreenShare && isTrackReference(track),
  );
  // Falls back to the first share if nothing is picked or the picked person stopped sharing.
  const screenShare =
    screenShares.find((track) => track.participant.identity === selectedSharer) ?? screenShares[0];
  const cameras = tracks.filter((track) => track.source === Track.Source.Camera);
  const keyOf = (track: (typeof tracks)[number]) => `${track.participant.identity}:${track.source}`;

  if (screenShare) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2 p-2 md:flex-row">
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {screenShares.length > 1 && (
            <div role="group" aria-label="Choose a shared screen" className="flex shrink-0 flex-wrap items-center gap-2">
              <span className="text-xs text-room-muted">Shared screens:</span>
              {screenShares.map((track) => {
                const viewing = track === screenShare;
                return (
                  <button
                    key={keyOf(track)}
                    type="button"
                    aria-pressed={viewing}
                    onClick={() => setSelectedSharer(track.participant.identity)}
                    className={cn(
                      "max-w-48 truncate rounded-md px-3 py-1 text-xs font-medium transition-colors",
                      viewing ? "bg-zoom-blue text-white" : "bg-room-tile text-room-text hover:bg-room-hover",
                    )}
                  >
                    {track.participant.isLocal ? "Your screen" : track.participant.name || track.participant.identity}
                  </button>
                );
              })}
            </div>
          )}
          <ParticipantTile key={keyOf(screenShare)} trackRef={screenShare} className="min-h-0 flex-1 bg-black" />
        </div>
        <div className="flex h-28 shrink-0 gap-2 overflow-x-auto md:h-auto md:w-56 md:flex-col md:overflow-y-auto">
          {cameras.map((track) => (
            <ParticipantTile key={keyOf(track)} trackRef={track} className="aspect-video w-44 shrink-0 md:w-full" />
          ))}
        </div>
      </div>
    );
  }

  const columns = galleryColumns(cameras.length);
  const rows = Math.max(1, Math.ceil(cameras.length / columns));

  return (
    <div
      className="grid h-full min-h-0 gap-2 p-2"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {cameras.map((track) => (
        <ParticipantTile key={keyOf(track)} trackRef={track} />
      ))}
    </div>
  );
}
