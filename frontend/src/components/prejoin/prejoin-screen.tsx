"use client";

import { CircleSlash, Info, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { CameraPreview } from "@/components/media/camera-preview";
import { MediaToggleButton } from "@/components/media/media-toggle-button";
import { FullScreenNotice } from "@/components/room/full-screen-notice";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAudioLevel } from "@/hooks/use-audio-level";
import { useMediaPreview } from "@/hooks/use-media-preview";
import { useCurrentUser, useMeeting } from "@/hooks/use-meetings";
import { DISPLAY_NAME_MAX_LENGTH, routes } from "@/lib/constants";
import { formatMeetingCode } from "@/lib/datetime";
import { getErrorMessage, hasErrorCode } from "@/lib/errors";
import {
  getOrCreateIdentity,
  getRememberedDisplayName,
  rememberDisplayName,
  saveJoinSession,
} from "@/lib/join-session";
import { validateDisplayName } from "@/lib/validation";

const homeLink = (
  <Link href={routes.home} className="rounded-lg bg-zoom-blue px-4 py-2 font-semibold text-white hover:bg-zoom-blue-hover">
    Back to Home
  </Link>
);

/**
 * Pre-join ("preview") screen: camera preview, mic/camera toggles and display
 * name, shown before anyone enters a meeting - both for invite links and for
 * hosts starting their own meeting.
 */
export function PreJoinScreen({
  code,
  wantsHost,
  startWithVideoOff,
}: {
  code: string;
  wantsHost: boolean;
  startWithVideoOff: boolean;
}) {
  const router = useRouter();
  const { data: meeting, isPending, isError, error, refetch } = useMeeting(code);
  const { data: user } = useCurrentUser();

  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(!startWithVideoOff);
  const [joining, setJoining] = useState(false);

  // Only the meeting's host may join as host. The backend enforces this too;
  // this check just keeps the UI honest.
  const isHost = wantsHost && Boolean(user && meeting && meeting.host.id === user.id);

  // Pre-fill the name: the host's profile name, otherwise the last name used on this device.
  useEffect(() => {
    if (nameTouched) return;
    const suggested = isHost ? user?.name : getRememberedDisplayName();
    if (suggested) setName(suggested);
  }, [isHost, user?.name, nameTouched]);

  const video = useMediaPreview("video", videoEnabled);
  const audio = useMediaPreview("audio", audioEnabled);
  const micLevel = useAudioLevel(audio.stream);

  const nameError = validateDisplayName(name);
  const showNameError = nameTouched && nameError !== null;

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    setNameTouched(true);
    if (nameError || joining) return;

    setJoining(true);
    const displayName = name.trim();
    rememberDisplayName(displayName);
    saveJoinSession(code, {
      identity: getOrCreateIdentity(code),
      displayName,
      role: isHost ? "host" : "guest",
      audioEnabled,
      videoEnabled,
    });
    // Leaving this page unmounts the preview, which releases the camera for LiveKit.
    router.push(routes.room(code));
  };

  if (isPending) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-room">
        <Spinner label="Checking meeting…" className="text-white" />
      </main>
    );
  }

  if (isError) {
    if (hasErrorCode(error, "MEETING_NOT_FOUND")) {
      return (
        <FullScreenNotice
          icon={<SearchX className="size-10 text-room-muted" aria-hidden />}
          title="This meeting ID is not valid"
          description="Please check the invite link or meeting ID and try again."
          actions={
            <>
              <Link href={routes.join} className="rounded-lg border border-room-hover px-4 py-2 hover:bg-room-hover">
                Join another meeting
              </Link>
              {homeLink}
            </>
          }
        />
      );
    }
    return (
      <FullScreenNotice
        icon={<CircleSlash className="size-10 text-room-muted" aria-hidden />}
        title="Unable to load this meeting"
        description={getErrorMessage(error)}
        actions={
          <>
            <Button onClick={() => refetch()}>Try again</Button>
            {homeLink}
          </>
        }
      />
    );
  }

  if (meeting.status === "ended") {
    return (
      <FullScreenNotice
        icon={<CircleSlash className="size-10 text-room-muted" aria-hidden />}
        title="This meeting has been ended by the host"
        actions={homeLink}
      />
    );
  }

  const waitingForHost = meeting.status === "scheduled" && !isHost;

  return (
    <main className="flex min-h-dvh flex-col bg-room text-room-text">
      <header className="flex h-14 items-center px-4 md:px-6">
        <Link href={routes.home} className="text-xl font-extrabold tracking-tight text-white">
          zoom <span className="text-xs font-semibold tracking-wide text-room-muted uppercase">clone</span>
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-8 px-4 pb-10 md:flex-row md:items-center md:gap-12">
        <section aria-label="Camera and microphone preview" className="w-full md:flex-[3]">
          <CameraPreview stream={video.stream} permission={video.permission} name={name.trim()} />
          <div className="mt-4 flex items-center justify-center gap-4">
            <MediaToggleButton
              kind="audio"
              enabled={audioEnabled}
              level={micLevel}
              onToggle={() => setAudioEnabled((value) => !value)}
            />
            <MediaToggleButton kind="video" enabled={videoEnabled} onToggle={() => setVideoEnabled((value) => !value)} />
          </div>
          {audio.permission === "denied" && (
            <p role="alert" className="mt-3 text-center text-sm text-room-muted">
              Microphone access is blocked. You can still join and allow it later.
            </p>
          )}
        </section>

        <section aria-labelledby="prejoin-title" className="w-full md:flex-[2]">
          <p className="text-sm text-room-muted">{isHost ? "Start your meeting" : "You're joining"}</p>
          <h1 id="prejoin-title" className="mt-1 text-2xl font-semibold break-words">
            {meeting.title}
          </h1>
          <p className="mt-1 text-sm text-room-muted">
            Meeting ID: {formatMeetingCode(meeting.meeting_code)} · Host: {meeting.host.name}
          </p>

          {waitingForHost && (
            <p className="mt-4 flex gap-2 rounded-lg bg-room-tile p-3 text-sm text-room-muted">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              The host hasn&apos;t started this meeting yet. Join now and you&apos;ll be let in as soon as they do.
            </p>
          )}

          <form onSubmit={handleJoin} noValidate className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="display-name" className="text-sm font-medium">
                Your Name
              </label>
              <input
                id="display-name"
                value={name}
                maxLength={DISPLAY_NAME_MAX_LENGTH + 10}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameTouched(true);
                }}
                onBlur={() => setNameTouched(true)}
                placeholder="Enter your name"
                autoComplete="name"
                aria-invalid={showNameError}
                aria-describedby={showNameError ? "display-name-error" : "display-name-hint"}
                className="h-11 rounded-lg border border-room-hover bg-room-tile px-3 text-[15px] text-room-text placeholder:text-room-muted focus:border-zoom-blue focus:outline-none aria-[invalid=true]:border-danger"
              />
              {showNameError ? (
                <p id="display-name-error" role="alert" className="text-[13px] text-[#ff8a8a]">
                  {nameError}
                </p>
              ) : (
                <p id="display-name-hint" className="text-[13px] text-room-muted">
                  This is how others will see you in the meeting.
                </p>
              )}
            </div>
            <Button type="submit" size="lg" loading={joining} disabled={nameError !== null} className="w-full">
              {isHost ? (meeting.status === "active" ? "Join as Host" : "Start Meeting") : "Join"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
