"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import { meetingsApi } from "@/lib/api/meetings";
import { routes } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { parseMeetingInput } from "@/lib/validation";

/**
 * Zoom's "Join Meeting" box. Accepts an ID (with or without spaces) or a full
 * invite link, validates the format locally, then asks the backend whether the
 * meeting exists and is still running before moving to the pre-join screen.
 */
export function JoinMeetingForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (checking) return;

    const parsed = parseMeetingInput(value);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setChecking(true);
    setError(null);
    try {
      const meeting = await meetingsApi.get(parsed.code);
      if (meeting.status === "ended") {
        setError("This meeting has been ended by the host.");
        return;
      }
      router.push(routes.preJoin(meeting.meeting_code));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <FormField label="Meeting ID or Invite Link" error={error ?? undefined}>
        {(field) => (
          <Input
            {...field}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter Meeting ID or Invite Link"
            autoComplete="off"
            inputMode="text"
            autoFocus
          />
        )}
      </FormField>
      <Button
        type="submit"
        size="lg"
        loading={checking}
        disabled={!value.trim()}
        className="w-full disabled:bg-surface-subtle disabled:text-ink-subtle"
      >
        Join
      </Button>
    </form>
  );
}
