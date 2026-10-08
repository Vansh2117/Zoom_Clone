"use client";

import { useParticipants } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { Mic, MicOff, UserMinus, Video, VideoOff, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog } from "@/components/ui/dialog";
import { meetingsApi } from "@/lib/api/meetings";
import { getErrorMessage } from "@/lib/errors";
import { getParticipantRole } from "@/lib/participant";

function sortParticipants(participants: Participant[]): Participant[] {
  // Me first, then the host, then everyone else alphabetically.
  const rank = (participant: Participant) =>
    participant.isLocal ? 0 : getParticipantRole(participant.metadata) === "host" ? 1 : 2;
  return [...participants].sort(
    (a, b) => rank(a) - rank(b) || (a.name ?? a.identity).localeCompare(b.name ?? b.identity),
  );
}

/** Live participant list. The host additionally gets Mute All and Remove. */
export function ParticipantsPanel({
  code,
  inviteUrl,
  isHost,
  onClose,
}: {
  code: string;
  inviteUrl: string;
  isHost: boolean;
  onClose: () => void;
}) {
  const participants = sortParticipants(useParticipants());
  const [removeTarget, setRemoveTarget] = useState<Participant | null>(null);
  const [busy, setBusy] = useState(false);

  const muteAll = async () => {
    setBusy(true);
    try {
      await meetingsApi.muteAll(code);
      toast.success("All participants have been muted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const removeParticipant = async () => {
    if (!removeTarget) return;
    setBusy(true);
    try {
      await meetingsApi.removeParticipant(code, removeTarget.identity);
      toast.success(`${removeTarget.name || "Participant"} was removed`);
      setRemoveTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="participants-heading" className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-room-hover px-4 py-3">
        <h2 id="participants-heading" className="text-sm font-semibold">
          Participants ({participants.length})
        </h2>
        <button type="button" aria-label="Close participants" onClick={onClose} className="rounded p-1 hover:bg-room-hover">
          <X className="size-4" aria-hidden />
        </button>
      </header>

      <ul className="flex-1 overflow-y-auto py-2">
        {participants.map((participant) => {
          const role = getParticipantRole(participant.metadata);
          const name = participant.name || participant.identity;
          const tags = [role === "host" && "Host", participant.isLocal && "me"].filter(Boolean).join(", ");
          const canRemove = isHost && !participant.isLocal && role !== "host";

          return (
            <li key={participant.identity} className="group flex items-center gap-3 px-4 py-2 hover:bg-room-hover">
              <Avatar name={name} className="size-8 text-xs" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {name}
                {tags && <span className="text-room-muted"> ({tags})</span>}
              </span>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => setRemoveTarget(participant)}
                  aria-label={`Remove ${name}`}
                  title="Remove"
                  className="rounded p-1 text-room-muted opacity-100 hover:bg-room-tile hover:text-danger md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                >
                  <UserMinus className="size-4" aria-hidden />
                </button>
              )}
              {participant.isMicrophoneEnabled ? (
                <Mic className="size-4 text-room-muted" aria-label="Microphone on" />
              ) : (
                <MicOff className="size-4 text-danger" aria-label="Muted" />
              )}
              {participant.isCameraEnabled ? (
                <Video className="size-4 text-room-muted" aria-label="Camera on" />
              ) : (
                <VideoOff className="size-4 text-danger" aria-label="Camera off" />
              )}
            </li>
          );
        })}
      </ul>

      <footer className="flex gap-2 border-t border-room-hover p-3">
        <CopyButton
          variant="secondary"
          text={inviteUrl}
          label="Invite"
          successMessage="Invite link copied"
          className="flex-1 border-room-hover bg-room-tile text-room-text hover:bg-room-hover"
        />
        {isHost && (
          <Button
            variant="secondary"
            size="sm"
            loading={busy && !removeTarget}
            onClick={muteAll}
            className="flex-1 border-room-hover bg-room-tile text-room-text hover:bg-room-hover"
          >
            Mute All
          </Button>
        )}
      </footer>

      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        tone="dark"
        title={`Remove ${removeTarget?.name || "this participant"}?`}
        description="They will be disconnected from the meeting."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setRemoveTarget(null)}
              className="text-room-muted hover:bg-room-hover"
            >
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={removeParticipant}>
              Remove
            </Button>
          </>
        }
      />
    </section>
  );
}
