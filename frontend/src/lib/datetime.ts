/**
 * Date helpers. The API speaks UTC ISO strings; everything shown to the user
 * is converted to the browser's local timezone here, in one place.
 */

export type Meridiem = "AM" | "PM";

const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Today", "Tomorrow", "Yesterday" or "Fri, Oct 10". */
export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return dayFormatter.format(date);
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

/** "10:30 AM - 11:00 AM" */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} - ${formatTime(endIso)}`;
}

/** "Fri, Oct 10, 2026 10:30 AM" */
export function formatFullDateTime(iso: string): string {
  return `${fullDateFormatter.format(new Date(iso))} ${formatTime(iso)}`;
}

/** "45 min", "1 hr", "1 hr 30 min" */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

/** Zoom groups digits: 329 759 7040 (10 digits), 123 456 789 (9), 123 4567 8901 (11). */
export function formatMeetingCode(code: string): string {
  if (code.length === 11) return `${code.slice(0, 3)} ${code.slice(3, 7)} ${code.slice(7)}`;
  if (code.length === 9 || code.length === 10) {
    return `${code.slice(0, 3)} ${code.slice(3, 6)} ${code.slice(6)}`;
  }
  return code;
}

/** "(GMT+5:30) Asia/Calcutta" for the browser's timezone. */
export function getTimezoneLabel(date: Date = new Date()): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return `(GMT${sign}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}) ${zone}`;
}

/** Local "YYYY-MM-DD" for <input type="date">. */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Zoom's time picker: 12:00, 12:30, 1:00 ... 11:30 (paired with an AM/PM select). */
export const TIME_SLOTS: readonly string[] = Array.from({ length: 24 }, (_, index) => {
  const hour = Math.floor(index / 2) === 0 ? 12 : Math.floor(index / 2);
  return `${hour}:${index % 2 === 0 ? "00" : "30"}`;
});

/**
 * Build a local Date from the form's date ("2026-10-09"), time ("1:30") and
 * meridiem ("PM"). Returns null when incomplete or invalid.
 */
export function combineLocalDateTime(dateValue: string, time: string, meridiem: Meridiem): Date | null {
  const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;

  const [, year, month, day] = dateMatch.map(Number);
  let hours = Number(timeMatch[1]) % 12;
  if (meridiem === "PM") hours += 12;
  const minutes = Number(timeMatch[2]);

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Default schedule slot like Zoom: the next half hour from now. */
export function nextHalfHourSlot(now: Date = new Date()): { date: string; time: string; meridiem: Meridiem } {
  const slot = new Date(now);
  slot.setSeconds(0, 0);
  slot.setMinutes(slot.getMinutes() < 30 ? 30 : 60);

  const hours24 = slot.getHours();
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return {
    date: toDateInputValue(slot),
    time: `${hour12}:${String(slot.getMinutes()).padStart(2, "0")}`,
    meridiem: hours24 < 12 ? "AM" : "PM",
  };
}
