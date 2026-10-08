"use client";

import { isTrackReference, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";

import { galleryColumns } from "@/lib/participant";

import { ParticipantTile } from "./participant-tile";

/**
 * Gallery view of everyone's camera. When someone shares their screen it takes
 * the main stage and cameras move to a filmstrip, like Zoom's share layout.
 */
export function VideoStage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const screenShare = tracks.find(
    (track) => track.source === Track.Source.ScreenShare && isTrackReference(track),
  );
  const cameras = tracks.filter((track) => track.source === Track.Source.Camera);
  const keyOf = (track: (typeof tracks)[number]) => `${track.participant.identity}:${track.source}`;

  if (screenShare) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2 p-2 md:flex-row">
        <ParticipantTile trackRef={screenShare} className="min-h-0 flex-1 bg-black" />
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
