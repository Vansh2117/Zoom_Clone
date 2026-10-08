"use client";

import { useEffect, useState } from "react";

export type MediaPermission = "off" | "pending" | "granted" | "denied" | "unavailable";

/**
 * Acquire a local camera or microphone stream while `enabled` is true, and
 * release the device as soon as it is disabled or the component unmounts
 * (so the camera light turns off and LiveKit can claim the device later).
 */
export function useMediaPreview(kind: "video" | "audio", enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<MediaPermission>("off");

  useEffect(() => {
    if (!enabled) {
      setPermission("off");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermission("unavailable");
      return;
    }

    let cancelled = false;
    let acquired: MediaStream | null = null;
    setPermission("pending");

    const constraints: MediaStreamConstraints =
      kind === "video" ? { video: { width: { ideal: 1280 }, height: { ideal: 720 } } } : { audio: true };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((mediaStream) => {
        if (cancelled) {
          stopStream(mediaStream);
          return;
        }
        acquired = mediaStream;
        setStream(mediaStream);
        setPermission("granted");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const name = error instanceof DOMException ? error.name : "";
        setPermission(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
      });

    return () => {
      cancelled = true;
      stopStream(acquired);
      setStream(null);
    };
  }, [kind, enabled]);

  return { stream, permission };
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}
