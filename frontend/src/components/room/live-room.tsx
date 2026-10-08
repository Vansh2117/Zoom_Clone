"use client";

import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { ConnectionState, DisconnectReason, MediaDeviceFailure, Room } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { meetingsApi, notifyLeft } from "@/lib/api/meetings";
import { getErrorMessage } from "@/lib/errors";
import { clearJoinSession, type JoinSession } from "@/lib/join-session";
import { silenceServerTeardownLogs } from "@/lib/livekit-logging";
import type { JoinMeetingResponse } from "@/types/api";

import { MeetingLayout } from "./meeting-layout";

silenceServerTeardownLogs();

/** Why the user is no longer in the room; decides what the page shows next. */
export type ExitReason = "left" | "ended-by-me" | "ended-by-host" | "removed" | "duplicate" | "disconnected";

function exitReasonFor(reason: DisconnectReason | undefined): ExitReason | null {
  switch (reason) {
    case DisconnectReason.CLIENT_INITIATED:
      return null; // we disconnected ourselves (leave flow, or React Strict Mode remount)
    case DisconnectReason.ROOM_DELETED:
      return "ended-by-host";
    case DisconnectReason.PARTICIPANT_REMOVED:
      return "removed";
    case DisconnectReason.DUPLICATE_IDENTITY:
      return "duplicate";
    default:
      return "disconnected";
  }
}

/**
 * Connects to LiveKit with the token from our backend. LiveKit owns the live
 * media and presence from here on; our backend is only told about lifecycle
 * events (leave / end).
 */
export function LiveRoom({
  join,
  session,
  onExit,
}: {
  join: JoinMeetingResponse;
  session: JoinSession;
  onExit: (reason: ExitReason) => void;
}) {
  const code = join.meeting.meeting_code;
  // Set as soon as *we* start leaving, so server-side disconnects that follow
  // (e.g. ROOM_DELETED after "End for All") aren't shown as surprises.
  const exitingRef = useRef(false);
  // Owning the Room instance lets us inspect its state in `handleError` below.
  const [room] = useState(() => new Room({ adaptiveStream: true, dynacast: true }));

  // Closing or refreshing the tab marks attendance as left; a refresh re-opens it on rejoin.
  useEffect(() => {
    const onPageHide = () => notifyLeft(code, session.identity);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      // Navigating away in-app (e.g. browser Back) unmounts the room without a page hide.
      // The ref is a plain flag, not a DOM node: its value at cleanup time is the one we want.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (!exitingRef.current && room.state === ConnectionState.Connected) {
        notifyLeft(code, session.identity);
      }
    };
  }, [code, session.identity, room]);

  const handleDisconnected = useCallback(
    (reason?: DisconnectReason) => {
      if (exitingRef.current) return;
      const exit = exitReasonFor(reason);
      if (!exit) return;
      if (exit !== "disconnected") clearJoinSession(code);
      onExit(exit);
    },
    [code, onExit],
  );

  const handleDeviceFailure = useCallback((failure?: MediaDeviceFailure) => {
    // Joining continues without that device, like Zoom's "join without video".
    const message =
      failure === MediaDeviceFailure.PermissionDenied
        ? "Camera or microphone access was denied. You joined without them; allow access in your browser to turn them on."
        : failure === MediaDeviceFailure.NotFound
          ? "No camera or microphone was found. You joined without them."
          : "Your camera or microphone couldn't be started.";
    toast.warning(message, { duration: 8000 });
  }, []);

  const handleError = useCallback(
    (error: Error) => {
      if (exitingRef.current) return;
      // Errors while connected are media problems (already reported by
      // handleDeviceFailure). Otherwise the connection itself may have failed
      // (LiveKit unreachable, token rejected). Re-check shortly: a cancelled
      // attempt, e.g. React Strict Mode's dev remount, is followed by a new one.
      window.setTimeout(() => {
        if (exitingRef.current || room.state !== ConnectionState.Disconnected) return;
        console.error("Failed to connect to the meeting room", error);
        onExit("disconnected");
      }, 1500);
    },
    [onExit, room],
  );

  return (
    <LiveKitRoom
      room={room}
      serverUrl={join.server_url}
      token={join.token}
      connect
      audio={session.audioEnabled}
      video={session.videoEnabled}
      onDisconnected={handleDisconnected}
      onMediaDeviceFailure={handleDeviceFailure}
      onError={handleError}
      className="h-dvh"
    >
      <RoomAudioRenderer />
      <ConnectedMeeting join={join} session={session} exitingRef={exitingRef} onExit={onExit} />
    </LiveKitRoom>
  );
}

function ConnectedMeeting({
  join,
  session,
  exitingRef,
  onExit,
}: {
  join: JoinMeetingResponse;
  session: JoinSession;
  exitingRef: { current: boolean };
  onExit: (reason: ExitReason) => void;
}) {
  const room = useRoomContext();
  const code = join.meeting.meeting_code;

  const leave = useCallback(async () => {
    exitingRef.current = true;
    notifyLeft(code, session.identity);
    clearJoinSession(code);
    await room.disconnect();
    onExit("left");
  }, [code, exitingRef, onExit, room, session.identity]);

  const endForAll = useCallback(async () => {
    exitingRef.current = true;
    // Leave before the room is deleted: if the server tears our connection down
    // first, livekit-client reports the aborted data channels as errors.
    await room.disconnect();
    try {
      // The backend marks the meeting ENDED, then deletes the LiveKit room,
      // which disconnects every other participant with reason ROOM_DELETED.
      await meetingsApi.end(code);
    } catch (error) {
      // The meeting is still running; the join session is kept so the host can rejoin and retry.
      toast.error(getErrorMessage(error));
      onExit("disconnected");
      return;
    }
    clearJoinSession(code);
    onExit("ended-by-me");
  }, [code, exitingRef, onExit, room]);

  return (
    <MeetingLayout meeting={join.meeting} isHost={join.role === "host"} onLeave={leave} onEndForAll={endForAll} />
  );
}
