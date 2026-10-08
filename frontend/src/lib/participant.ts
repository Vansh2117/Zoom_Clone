import type { ParticipantRole } from "@/types/api";

/**
 * The backend puts `{"role": "host" | "guest"}` into each participant's LiveKit
 * token metadata, so every client can label the host without an extra API call.
 */
export function getParticipantRole(metadata: string | undefined): ParticipantRole {
  if (!metadata) return "guest";
  try {
    const parsed: unknown = JSON.parse(metadata);
    return (parsed as { role?: unknown }).role === "host" ? "host" : "guest";
  } catch {
    return "guest";
  }
}

/** Zoom-style gallery: 1, 2x1, 2x2, 3x3, then 4 columns. */
export function galleryColumns(count: number): number {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}
