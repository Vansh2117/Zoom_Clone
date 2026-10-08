"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

/**
 * Confirmation before leaving, as in Zoom:
 * - guests choose Leave / Cancel;
 * - the host chooses End Meeting for All, Leave Meeting (the meeting keeps
 *   running for others) or Cancel.
 */
export function LeaveMeetingDialog({
  open,
  onOpenChange,
  isHost,
  onLeave,
  onEndForAll,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isHost: boolean;
  onLeave: () => void;
  onEndForAll: () => void;
  pending: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      tone="dark"
      title={isHost ? "End or leave this meeting?" : "Are you sure you want to leave this meeting?"}
      description={
        isHost
          ? "If you leave, the meeting keeps going for everyone else. End it to close it for all participants."
          : undefined
      }
      footer={
        <div className="flex w-full flex-col gap-2">
          {isHost && (
            <Button variant="danger" size="lg" loading={pending} onClick={onEndForAll} className="w-full">
              End Meeting for All
            </Button>
          )}
          <Button
            variant={isHost ? "secondary" : "danger"}
            size="lg"
            disabled={pending}
            onClick={onLeave}
            className={isHost ? "w-full border-room-hover bg-room-tile text-room-text hover:bg-room-hover" : "w-full"}
          >
            Leave Meeting
          </Button>
          <Button
            variant="ghost"
            size="lg"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            className="w-full text-room-muted hover:bg-room-hover"
          >
            Cancel
          </Button>
        </div>
      }
    />
  );
}
