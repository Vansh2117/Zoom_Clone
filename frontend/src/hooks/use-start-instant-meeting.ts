"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import { routes } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";

import { useCreateInstantMeeting } from "./use-meetings";

/** Create an instant meeting and take the host to the pre-join screen (camera preview). */
export function useStartInstantMeeting() {
  const router = useRouter();
  const { create, isPending } = useCreateInstantMeeting();

  const start = useCallback(
    async ({ videoOff = false }: { videoOff?: boolean } = {}) => {
      try {
        const meeting = await create();
        if (meeting) router.push(routes.preJoin(meeting.meeting_code, { host: true, videoOff }));
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [create, router],
  );

  return { start, isPending };
}
