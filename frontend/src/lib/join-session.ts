import type { ParticipantRole } from "@/types/api";

import { readJson, removeItem, writeJson } from "./storage";

/**
 * What the pre-join screen hands to the meeting room.
 *
 * Stored in *sessionStorage* on purpose:
 * - it survives a page refresh, so the room can silently rejoin (same identity,
 *   so the backend and LiveKit treat it as the same participant);
 * - it is per tab, so opening the invite link in a second tab joins as a
 *   separate participant (handy for testing host + guest on one machine).
 */
export interface JoinSession {
  identity: string;
  displayName: string;
  role: ParticipantRole;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

const sessionKey = (code: string) => `zoom-clone:join:${code}`;
const DISPLAY_NAME_KEY = "zoom-clone:display-name";

export function saveJoinSession(code: string, session: JoinSession): void {
  writeJson("session", sessionKey(code), session);
}

export function loadJoinSession(code: string): JoinSession | null {
  const value = readJson<Partial<JoinSession>>("session", sessionKey(code));
  if (
    !value ||
    typeof value.identity !== "string" ||
    typeof value.displayName !== "string" ||
    (value.role !== "host" && value.role !== "guest")
  ) {
    return null;
  }
  return {
    identity: value.identity,
    displayName: value.displayName,
    role: value.role,
    audioEnabled: value.audioEnabled !== false,
    videoEnabled: value.videoEnabled !== false,
  };
}

export function clearJoinSession(code: string): void {
  removeItem("session", sessionKey(code));
}

/** Keep the identity if this tab already joined the meeting (refresh / rejoin). */
export function getOrCreateIdentity(code: string): string {
  return loadJoinSession(code)?.identity ?? createIdentity();
}

export function createIdentity(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // crypto.randomUUID needs a secure context; fall back for plain-http LAN testing.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Remember the last display name used, as a convenience for the next meeting. */
export function getRememberedDisplayName(): string {
  return readJson<string>("local", DISPLAY_NAME_KEY) ?? "";
}

export function rememberDisplayName(name: string): void {
  writeJson("local", DISPLAY_NAME_KEY, name);
}
