"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { meetingsApi } from "@/lib/api/meetings";
import { routes } from "@/lib/constants";
import { hasErrorCode } from "@/lib/errors";
import { loadJoinSession, type JoinSession } from "@/lib/join-session";
import type { JoinMeetingResponse } from "@/types/api";

export type ConnectionPhase =
  | { kind: "joining" }
  | { kind: "waiting-for-host" }
  | { kind: "ready"; join: JoinMeetingResponse; session: JoinSession }
  | { kind: "failed"; error: unknown };

/**
 * Gets the meeting room ready: reads the pre-join choices from sessionStorage
 * (or sends the user back to the pre-join screen), then asks the backend for a
 * video token. A page refresh lands here too and simply rejoins with the same
 * identity, which is how "reconnect after refresh" works.
 */
export function useMeetingConnection(code: string) {
  const router = useRouter();
  const [phase, setPhase] = useState<ConnectionPhase>({ kind: "joining" });
  const sessionRef = useRef<JoinSession | null>(null);
  const startedRef = useRef(false);

  const requestToken = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    setPhase({ kind: "joining" });
    try {
      const join = await meetingsApi.join(code, {
        display_name: session.displayName,
        identity: session.identity,
        role: session.role,
      });
      setPhase({ kind: "ready", join, session });
    } catch (error) {
      setPhase(hasErrorCode(error, "MEETING_NOT_STARTED") ? { kind: "waiting-for-host" } : { kind: "failed", error });
    }
  }, [code]);

  useEffect(() => {
    // Guard against React Strict Mode running this effect twice in development.
    if (startedRef.current) return;
    startedRef.current = true;

    const session = loadJoinSession(code);
    if (!session) {
      router.replace(routes.preJoin(code));
      return;
    }
    sessionRef.current = session;
    void requestToken();
  }, [code, requestToken, router]);

  return { phase, retry: requestToken };
}
