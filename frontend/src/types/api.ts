/**
 * Types mirroring the backend's Pydantic schemas (backend/app/schemas).
 * Timestamps are ISO-8601 strings in UTC (suffix "Z"); convert with lib/datetime.
 */

export type MeetingStatus = "scheduled" | "active" | "ended";
export type ParticipantRole = "host" | "guest";

export interface User {
  id: number;
  name: string;
  email: string;
  personal_meeting_id: string;
}

export interface Meeting {
  meeting_code: string;
  title: string;
  description: string | null;
  status: MeetingStatus;
  is_instant: boolean;
  scheduled_at: string;
  scheduled_end_at: string;
  duration_minutes: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  host: { id: number; name: string };
  participant_count: number;
  invite_url: string;
}

export interface ScheduleMeetingInput {
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
}

export interface JoinMeetingInput {
  display_name: string;
  identity: string;
  role: ParticipantRole;
}

export interface JoinMeetingResponse {
  token: string;
  server_url: string;
  identity: string;
  role: ParticipantRole;
  meeting: Meeting;
}

export interface AttendanceRecord {
  identity: string;
  display_name: string;
  role: ParticipantRole;
  joined_at: string;
  left_at: string | null;
}

/** Machine-readable error codes returned by the backend (app/core/errors.py). */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "MEETING_NOT_FOUND"
  | "MEETING_ENDED"
  | "MEETING_NOT_STARTED"
  | "INVALID_MEETING_STATE"
  | "PARTICIPANT_NOT_FOUND"
  | "VIDEO_SERVICE_UNAVAILABLE"
  | "VIDEO_SERVICE_ERROR"
  | "INTERNAL_ERROR"
  // Client-side only: the request never reached the server.
  | "NETWORK_ERROR";

export interface ApiErrorDetail {
  field: string | null;
  message: string;
}
