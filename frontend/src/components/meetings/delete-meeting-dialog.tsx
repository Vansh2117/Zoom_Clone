"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useDeleteMeeting } from "@/hooks/use-meetings";
import { getErrorMessage } from "@/lib/errors";
import type { Meeting } from "@/types/api";

export function DeleteMeetingDialog({
  meeting,
  onOpenChange,
  onDeleted,
}: {
  meeting: Meeting | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const deleteMeeting = useDeleteMeeting();

  const confirm = async () => {
    if (!meeting) return;
    try {
      await deleteMeeting.mutateAsync(meeting.meeting_code);
      toast.success("Meeting deleted");
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog
      open={meeting !== null}
      onOpenChange={onOpenChange}
      title="Delete this meeting?"
      description={meeting ? `"${meeting.title}" will be removed and its invite link will stop working.` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleteMeeting.isPending} onClick={confirm}>
            Delete
          </Button>
        </>
      }
    />
  );
}
