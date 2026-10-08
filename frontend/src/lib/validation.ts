import { DESCRIPTION_MAX_LENGTH, DISPLAY_NAME_MAX_LENGTH, TITLE_MAX_LENGTH } from "./constants";

/** Same rule as the backend (app/domain/text.py): no HTML tags, plain "<" is fine. */
const HTML_TAG_PATTERN = /<\s*\/?\s*[a-zA-Z!?]/;
const MEETING_CODE_PATTERN = /^\d{9,11}$/;
const INVITE_LINK_PATTERN = /\/(?:j|meeting)\/(\d{9,11})(?:[/?#]|$)/;

export type ParseResult = { ok: true; code: string } | { ok: false; error: string };

/**
 * Accepts what people actually paste into Zoom's join box:
 * "8272914420", "827 291 4420", "827-291-4420" or a full invite link.
 * Validates the format locally so obviously bad input never hits the API.
 */
export function parseMeetingInput(raw: string): ParseResult {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Please enter a meeting ID or invite link." };

  const fromLink = value.match(INVITE_LINK_PATTERN);
  if (fromLink) return { ok: true, code: fromLink[1] };

  const digits = value.replace(/[\s-]/g, "");
  if (!/^\d+$/.test(digits)) {
    return { ok: false, error: "A meeting ID contains only numbers, or paste the full invite link." };
  }
  if (!MEETING_CODE_PATTERN.test(digits)) {
    return { ok: false, error: "A meeting ID has 9 to 11 digits." };
  }
  return { ok: true, code: digits };
}

export function isValidMeetingCode(code: string): boolean {
  return MEETING_CODE_PATTERN.test(code);
}

export function validateDisplayName(name: string): string | null {
  const value = name.trim();
  if (!value) return "Please enter your name.";
  if (value.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`;
  }
  if (HTML_TAG_PATTERN.test(value)) return "Name can't contain HTML.";
  return null;
}

export interface ScheduleFormValues {
  title: string;
  description: string;
  startsAt: Date | null;
  durationMinutes: number;
}

export type ScheduleFormErrors = Partial<Record<"title" | "description" | "startsAt", string>>;

export function validateScheduleForm(values: ScheduleFormValues, now: Date = new Date()): ScheduleFormErrors {
  const errors: ScheduleFormErrors = {};
  const title = values.title.trim();

  if (!title) errors.title = "Topic is required.";
  else if (title.length > TITLE_MAX_LENGTH) errors.title = `Topic must be ${TITLE_MAX_LENGTH} characters or fewer.`;
  else if (HTML_TAG_PATTERN.test(title)) errors.title = "Topic can't contain HTML.";

  if (values.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  } else if (HTML_TAG_PATTERN.test(values.description)) {
    errors.description = "Description can't contain HTML.";
  }

  if (!values.startsAt || Number.isNaN(values.startsAt.getTime())) {
    errors.startsAt = "Please choose a date and time.";
  } else if (values.startsAt.getTime() <= now.getTime()) {
    errors.startsAt = "Please choose a time in the future.";
  }

  return errors;
}
