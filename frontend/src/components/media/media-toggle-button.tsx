"use client";

import { Mic, MicOff, Video, VideoOff } from "lucide-react";

import { cn } from "@/lib/cn";

/** Round mic/camera toggle used on the pre-join screen. */
export function MediaToggleButton({
  kind,
  enabled,
  onToggle,
  level = 0,
}: {
  kind: "audio" | "video";
  enabled: boolean;
  onToggle: () => void;
  level?: number;
}) {
  const Icon = kind === "audio" ? (enabled ? Mic : MicOff) : enabled ? Video : VideoOff;
  const label =
    kind === "audio" ? (enabled ? "Mute microphone" : "Unmute microphone") : enabled ? "Stop video" : "Start video";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      className={cn(
        "relative flex size-12 items-center justify-center overflow-hidden rounded-full transition-colors",
        enabled ? "bg-white/15 text-white hover:bg-white/25" : "bg-danger text-white hover:bg-danger-hover",
      )}
    >
      {kind === "audio" && enabled && (
        // Fills from the bottom with the live mic level.
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 bg-speaking/50 transition-[height] duration-75"
          style={{ height: `${Math.round(level * 100)}%` }}
        />
      )}
      <Icon className="relative size-5" aria-hidden />
    </button>
  );
}
