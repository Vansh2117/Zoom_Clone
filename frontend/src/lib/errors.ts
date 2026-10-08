import type { ApiErrorCode } from "@/types/api";

import { isApiError } from "./api/client";

/** Friendly copy for each backend error code (modelled on Zoom's own wording). */
const MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  NETWORK_ERROR: "Can't connect to the server. Check your internet connection and try again.",
  MEETING_NOT_FOUND: "This meeting ID is not valid. Please check and try again.",
  MEETING_ENDED: "This meeting has been ended by the host.",
  MEETING_NOT_STARTED: "Please wait, the host has not started this meeting yet.",
  FORBIDDEN: "Only the host can do that.",
  INVALID_MEETING_STATE: "That action isn't available for this meeting right now.",
  PARTICIPANT_NOT_FOUND: "That participant is no longer in the meeting.",
  VIDEO_SERVICE_UNAVAILABLE:
    "Video isn't set up on the server yet. Add the LiveKit keys to backend/.env and restart it.",
  VIDEO_SERVICE_ERROR: "The video service didn't respond. Please try again.",
  INTERNAL_ERROR: "Something went wrong on our side. Please try again.",
};

const FALLBACK = "Something went wrong. Please try again.";

/** Turn any thrown value into a sentence that is safe to show to the user. */
export function getErrorMessage(error: unknown): string {
  if (!isApiError(error)) return FALLBACK;
  if (error.code === "VALIDATION_ERROR" || error.code === "INVALID_MEETING_STATE") {
    // The backend's validation messages are already written for humans.
    return error.message || MESSAGES[error.code] || FALLBACK;
  }
  return MESSAGES[error.code] ?? FALLBACK;
}

export function hasErrorCode(error: unknown, code: ApiErrorCode): boolean {
  return isApiError(error) && error.code === code;
}
