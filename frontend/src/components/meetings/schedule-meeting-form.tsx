"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import { isApiError } from "@/lib/api/client";
import {
  DEFAULT_DURATION,
  DESCRIPTION_MAX_LENGTH,
  DURATION_OPTIONS,
  TITLE_MAX_LENGTH,
} from "@/lib/constants";
import {
  TIME_SLOTS,
  combineLocalDateTime,
  formatDuration,
  getTimezoneLabel,
  nextHalfHourSlot,
  toDateInputValue,
  type Meridiem,
} from "@/lib/datetime";
import { getErrorMessage } from "@/lib/errors";
import { validateScheduleForm, type ScheduleFormErrors } from "@/lib/validation";
import type { Meeting, ScheduleMeetingInput } from "@/types/api";

export interface ScheduleMeetingFormProps {
  onSubmit: (input: ScheduleMeetingInput) => Promise<Meeting>;
  onCancel: () => void;
  defaultTitle?: string;
}

/** Field names the backend may flag, mapped to this form's fields. */
const SERVER_FIELDS: Record<string, keyof ScheduleFormErrors> = {
  title: "title",
  description: "description",
  scheduled_at: "startsAt",
};

/**
 * Zoom's "Schedule Meeting" form. Validates locally for instant feedback, then
 * shows any server-side validation errors next to the matching field.
 */
export function ScheduleMeetingForm({ onSubmit, onCancel, defaultTitle = "My Meeting" }: ScheduleMeetingFormProps) {
  const [initialSlot] = useState(() => nextHalfHourSlot());
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [date, setDate] = useState(initialSlot.date);
  const [time, setTime] = useState(initialSlot.time);
  const [meridiem, setMeridiem] = useState<Meridiem>(initialSlot.meridiem);
  const [duration, setDuration] = useState<number>(DEFAULT_DURATION);
  const [errors, setErrors] = useState<ScheduleFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const timezoneLabel = useMemo(() => getTimezoneLabel(), []);
  const today = useMemo(() => toDateInputValue(new Date()), []);

  // Like Zoom: the topic is focused and pre-selected so typing replaces "My Meeting".
  useEffect(() => {
    titleRef.current?.select();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const startsAt = combineLocalDateTime(date, time, meridiem);
    const validation = validateScheduleForm({ title, description, startsAt, durationMinutes: duration });
    setErrors(validation);
    setFormError(null);
    if (Object.keys(validation).length > 0 || !startsAt) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        scheduled_at: startsAt.toISOString(), // the browser converts local time to UTC here
        duration_minutes: duration,
      });
    } catch (error) {
      const fieldErrors: ScheduleFormErrors = {};
      if (isApiError(error)) {
        for (const detail of error.details) {
          const field = detail.field ? SERVER_FIELDS[detail.field] : undefined;
          if (field) fieldErrors[field] = detail.message;
        }
      }
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-[980px] flex-col gap-6">
      {formError && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {formError}
        </p>
      )}

      <FormField label="Topic" required layout="inline" error={errors.title}>
        {(field) => (
          <div className="max-w-[490px]">
            <Input
              {...field}
              ref={titleRef}
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
            />
          </div>
        )}
      </FormField>

      <div className="grid gap-2 md:grid-cols-[170px_1fr] md:gap-4">
        <div className="hidden md:block" />
        {showDescription ? (
          <FormField label="Description" error={errors.description}>
            {(field) => (
              <div className="max-w-[490px]">
                <Textarea
                  {...field}
                  value={description}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  placeholder="Enter your meeting description"
                  onChange={(event) => setDescription(event.target.value)}
                  autoFocus
                />
              </div>
            )}
          </FormField>
        ) : (
          <Button variant="link" className="w-fit" onClick={() => setShowDescription(true)}>
            <Plus className="size-4" aria-hidden />
            Add Description
          </Button>
        )}
      </div>

      <fieldset className="grid gap-2 md:grid-cols-[170px_1fr] md:gap-4">
        <legend className="sr-only">When</legend>
        <span aria-hidden className="text-[15px] text-ink md:pt-2.5">
          When
        </span>
        <div>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="schedule-date">
              Date
            </label>
            <Input
              id="schedule-date"
              type="date"
              min={today}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-invalid={Boolean(errors.startsAt)}
              aria-describedby={errors.startsAt ? "schedule-when-error" : undefined}
              className="w-[240px]"
            />
            <label className="sr-only" htmlFor="schedule-time">
              Time
            </label>
            <Select
              id="schedule-time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              wrapperClassName="w-[196px]"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="schedule-meridiem">
              AM or PM
            </label>
            <Select
              id="schedule-meridiem"
              value={meridiem}
              onChange={(event) => setMeridiem(event.target.value as Meridiem)}
              wrapperClassName="w-[104px]"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </Select>
          </div>
          {errors.startsAt && (
            <p id="schedule-when-error" role="alert" className="mt-1.5 text-[13px] text-danger">
              {errors.startsAt}
            </p>
          )}
        </div>
      </fieldset>

      <FormField label="Duration" layout="inline">
        {(field) => (
          <Select
            {...field}
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            wrapperClassName="w-[240px]"
          >
            {DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <FormField label="Time Zone" layout="inline">
        {(field) => (
          <div className="max-w-[490px]">
            <Input {...field} value={timezoneLabel} readOnly disabled />
            <p className="mt-1.5 text-[13px] text-ink-subtle">Meetings use your browser&apos;s time zone.</p>
          </div>
        )}
      </FormField>

      <fieldset className="grid gap-2 md:grid-cols-[170px_1fr] md:gap-4">
        <legend className="sr-only">Meeting ID</legend>
        <span aria-hidden className="text-[15px] text-ink">
          Meeting ID
        </span>
        <div className="flex flex-wrap gap-6 text-[15px]">
          <label className="flex items-center gap-2">
            <input type="radio" name="meeting-id" defaultChecked className="size-4 accent-zoom-blue" />
            Generate Automatically
          </label>
          <label className="flex items-center gap-2 text-ink-subtle" title="Not available in this clone">
            <input type="radio" name="meeting-id" disabled className="size-4" />
            Personal Meeting ID
          </label>
        </div>
      </fieldset>

      <div className="flex gap-2 md:pl-[186px]">
        <Button type="submit" loading={submitting}>
          Save
        </Button>
        <Button variant="soft" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
