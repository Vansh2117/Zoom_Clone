"use client";

import { Mic } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useAudioLevel } from "@/hooks/use-audio-level";
import { useMediaPreview } from "@/hooks/use-media-preview";

import { CameraPreview } from "./camera-preview";

function micHint(permission: string): string {
  if (permission === "denied") return "Microphone access is blocked in your browser.";
  if (permission === "unavailable") return "No microphone was found.";
  return "Speak, and the bar should move.";
}

/** Dashboard "Test Audio and Video": camera preview + live microphone meter. */
export function TestAudioVideoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Devices are only requested while the dialog is open, and released on close.
  const video = useMediaPreview("video", open);
  const audio = useMediaPreview("audio", open);
  const level = useAudioLevel(audio.stream);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Test Audio and Video"
      description="Check that people can see and hear you before joining a meeting."
      className="max-w-lg"
      footer={<Button onClick={() => onOpenChange(false)}>Done</Button>}
    >
      <CameraPreview stream={video.stream} permission={video.permission} name="" />
      <div className="mt-4 flex items-center gap-3">
        <Mic className="size-5 text-ink-subtle" aria-hidden />
        <div
          role="meter"
          aria-label="Microphone input level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(level * 100)}
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface-subtle"
        >
          <div className="h-full bg-speaking transition-[width] duration-75" style={{ width: `${level * 100}%` }} />
        </div>
      </div>
      <p className="mt-2 text-[13px] text-ink-subtle">{micHint(audio.permission)}</p>
    </Dialog>
  );
}
