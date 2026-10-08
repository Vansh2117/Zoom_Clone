/** Mirrors backend validation (app/schemas) so the UI can validate before calling the API. */
export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;
export const DEFAULT_DURATION = 30;
export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 2000;
export const DISPLAY_NAME_MAX_LENGTH = 50;

export const WAITING_ROOM_POLL_MS = 5_000;

export const routes = {
  home: "/",
  join: "/join",
  profile: "/profile",
  meetings: "/meetings",
  schedule: "/meetings/schedule",
  meetingDetails: (code: string) => `/meetings/${code}`,
  /** Pre-join screen; also the public invite link format. */
  preJoin: (code: string, options: { host?: boolean; videoOff?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (options.host) params.set("role", "host");
    if (options.videoOff) params.set("video", "off");
    const query = params.toString();
    return `/j/${code}${query ? `?${query}` : ""}`;
  },
  room: (code: string) => `/meeting/${code}`,
} as const;
