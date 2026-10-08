import type {
  AttendanceRecord,
  JoinMeetingInput,
  JoinMeetingResponse,
  Meeting,
  ScheduleMeetingInput,
  User,
} from "@/types/api";

import { apiRequest, apiUrl } from "./client";

/** One function per backend endpoint. Components never build URLs or call fetch directly. */
export const meetingsApi = {
  getMe: () => apiRequest<User>("/me"),

  listUpcoming: () => apiRequest<Meeting[]>("/meetings/upcoming"),
  listRecent: () => apiRequest<Meeting[]>("/meetings/recent"),
  get: (code: string) => apiRequest<Meeting>(`/meetings/${code}`),

  createInstant: () => apiRequest<Meeting>("/meetings/instant", { method: "POST" }),
  schedule: (input: ScheduleMeetingInput) =>
    apiRequest<Meeting>("/meetings", { method: "POST", body: input }),
  remove: (code: string) => apiRequest<void>(`/meetings/${code}`, { method: "DELETE" }),
  end: (code: string) => apiRequest<Meeting>(`/meetings/${code}/end`, { method: "POST" }),

  join: (code: string, input: JoinMeetingInput) =>
    apiRequest<JoinMeetingResponse>(`/meetings/${code}/join`, { method: "POST", body: input }),
  attendance: (code: string) => apiRequest<AttendanceRecord[]>(`/meetings/${code}/participants`),

  muteAll: (code: string) => apiRequest<void>(`/meetings/${code}/host/mute-all`, { method: "POST" }),
  removeParticipant: (code: string, identity: string) =>
    apiRequest<void>(`/meetings/${code}/host/remove`, { method: "POST", body: { identity } }),
};

/**
 * Record that this participant left. Uses `sendBeacon` because it survives the
 * page being closed or refreshed, unlike a normal fetch.
 */
export function notifyLeft(code: string, identity: string): void {
  const url = apiUrl(`/meetings/${code}/participants/${identity}/leave`);
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    if (navigator.sendBeacon(url)) return;
  }
  void fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
}
