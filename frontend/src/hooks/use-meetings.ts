"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

import { meetingsApi } from "@/lib/api/meetings";
import type { Meeting, ScheduleMeetingInput } from "@/types/api";

/** Central list of cache keys, so invalidation can't drift out of sync with queries. */
export const queryKeys = {
  me: ["me"] as const,
  upcoming: ["meetings", "upcoming"] as const,
  recent: ["meetings", "recent"] as const,
  meeting: (code: string) => ["meetings", "detail", code] as const,
  attendance: (code: string) => ["meetings", "attendance", code] as const,
};

/** Refresh the dashboard lists after any change (detail queries are left alone). */
function invalidateMeetingLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.upcoming }),
    queryClient.invalidateQueries({ queryKey: queryKeys.recent }),
  ]);
}

export function useCurrentUser() {
  return useQuery({ queryKey: queryKeys.me, queryFn: meetingsApi.getMe, staleTime: Infinity });
}

export function useUpcomingMeetings() {
  return useQuery({ queryKey: queryKeys.upcoming, queryFn: meetingsApi.listUpcoming });
}

export function useRecentMeetings() {
  return useQuery({ queryKey: queryKeys.recent, queryFn: meetingsApi.listRecent });
}

export function useMeeting(code: string, options: { refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: queryKeys.meeting(code),
    queryFn: () => meetingsApi.get(code),
    refetchInterval: options.refetchInterval,
  });
}

export function useAttendance(code: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.attendance(code),
    queryFn: () => meetingsApi.attendance(code),
    enabled,
  });
}

/**
 * "New Meeting". Guarded against double clicks twice over: the button is
 * disabled while pending, and a ref blocks a second call fired in the same
 * tick (before React has re-rendered the disabled button).
 */
export function useCreateInstantMeeting() {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);
  const mutation = useMutation({
    mutationFn: meetingsApi.createInstant,
    onSuccess: () => invalidateMeetingLists(queryClient),
  });
  const { mutateAsync } = mutation;

  const create = useCallback(async (): Promise<Meeting | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    try {
      return await mutateAsync();
    } finally {
      inFlight.current = false;
    }
  }, [mutateAsync]);

  return { create, isPending: mutation.isPending };
}

export function useScheduleMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleMeetingInput) => meetingsApi.schedule(input),
    onSuccess: (meeting) => {
      queryClient.setQueryData(queryKeys.meeting(meeting.meeting_code), meeting);
      return invalidateMeetingLists(queryClient);
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => meetingsApi.remove(code),
    onSuccess: () => invalidateMeetingLists(queryClient),
  });
}

export function useEndMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => meetingsApi.end(code),
    onSuccess: () => invalidateMeetingLists(queryClient),
  });
}
