"use client";

import { VideoOff } from "lucide-react";
import { useEffect, useRef } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import type { MediaPermission } from "@/hooks/use-media-preview";
import { cn } from "@/lib/cn";

const PERMISSION_MESSAGES: Partial<Record<MediaPermission, string>> = {
  denied: "Camera access is blocked. Allow it from the camera icon in your browser's address bar.",
  unavailable: "No camera found, or it is being used by another app.",
};

/** Mirrored self-view with clear states for "off", "loading" and "blocked". */
export function CameraPreview({
  stream,
  permission,
  name,
  className,
}: {
  stream: MediaStream | null;
  permission: MediaPermission;
  name: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const showVideo = permission === "granted" && stream !== null;
  const message = PERMISSION_MESSAGES[permission];

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-xl bg-room-tile", className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-label="Your camera preview"
        className={cn("video-mirror h-full w-full object-cover", !showVideo && "hidden")}
      />
      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-room-text">
          {permission === "pending" ? (
            <Spinner label="Starting camera…" className="text-white" />
          ) : (
            <>
              <Avatar name={name || "You"} className="size-20 rounded-2xl text-2xl" />
              {message ? (
                <p role="alert" className="flex max-w-xs items-center gap-2 text-sm text-room-muted">
                  <VideoOff className="size-4 shrink-0" aria-hidden />
                  {message}
                </p>
              ) : (
                <p className="text-sm text-room-muted">Your camera is off</p>
              )}
            </>
          )}
        </div>
      )}
      {name && (
        <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-xs text-white">{name}</span>
      )}
    </div>
  );
}
