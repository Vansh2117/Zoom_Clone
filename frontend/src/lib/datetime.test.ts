import {
  TIME_SLOTS,
  combineLocalDateTime,
  formatDayLabel,
  formatDuration,
  formatMeetingCode,
  getTimezoneLabel,
  nextHalfHourSlot,
  toDateInputValue,
} from "./datetime";

describe("formatMeetingCode", () => {
  it("groups digits like Zoom", () => {
    expect(formatMeetingCode("3297597040")).toBe("329 759 7040");
    expect(formatMeetingCode("123456789")).toBe("123 456 789");
    expect(formatMeetingCode("12345678901")).toBe("123 4567 8901");
  });
});

describe("formatDuration", () => {
  it("formats minutes and hours", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(90)).toBe("1 hr 30 min");
    expect(formatDuration(120)).toBe("2 hr");
  });
});

describe("formatDayLabel", () => {
  const now = new Date(2026, 9, 9, 12, 0);

  it("uses relative words for nearby days", () => {
    expect(formatDayLabel(new Date(2026, 9, 9, 18, 0).toISOString(), now)).toBe("Today");
    expect(formatDayLabel(new Date(2026, 9, 10, 9, 0).toISOString(), now)).toBe("Tomorrow");
    expect(formatDayLabel(new Date(2026, 9, 8, 9, 0).toISOString(), now)).toBe("Yesterday");
  });

  it("uses a date otherwise", () => {
    expect(formatDayLabel(new Date(2026, 9, 20, 9, 0).toISOString(), now)).not.toMatch(/Today|Tomorrow|Yesterday/);
  });
});

describe("TIME_SLOTS", () => {
  it("lists 30-minute slots on a 12-hour clock", () => {
    expect(TIME_SLOTS).toHaveLength(24);
    expect(TIME_SLOTS[0]).toBe("12:00");
    expect(TIME_SLOTS[1]).toBe("12:30");
    expect(TIME_SLOTS[2]).toBe("1:00");
    expect(TIME_SLOTS[23]).toBe("11:30");
  });
});

describe("combineLocalDateTime", () => {
  it("builds a local date from date, time and meridiem", () => {
    const date = combineLocalDateTime("2026-10-09", "1:30", "PM");
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(9);
    expect(date?.getHours()).toBe(13);
    expect(date?.getMinutes()).toBe(30);
  });

  it("handles 12 AM and 12 PM", () => {
    expect(combineLocalDateTime("2026-10-09", "12:00", "AM")?.getHours()).toBe(0);
    expect(combineLocalDateTime("2026-10-09", "12:30", "PM")?.getHours()).toBe(12);
  });

  it("returns null for incomplete input", () => {
    expect(combineLocalDateTime("", "1:30", "PM")).toBeNull();
    expect(combineLocalDateTime("2026-10-09", "", "PM")).toBeNull();
  });
});

describe("nextHalfHourSlot", () => {
  it("rounds up to the next half hour", () => {
    expect(nextHalfHourSlot(new Date(2026, 9, 9, 10, 10))).toEqual({ date: "2026-10-09", time: "10:30", meridiem: "AM" });
    expect(nextHalfHourSlot(new Date(2026, 9, 9, 10, 40))).toEqual({ date: "2026-10-09", time: "11:00", meridiem: "AM" });
    expect(nextHalfHourSlot(new Date(2026, 9, 9, 12, 5))).toEqual({ date: "2026-10-09", time: "12:30", meridiem: "PM" });
  });

  it("rolls over to the next day", () => {
    expect(nextHalfHourSlot(new Date(2026, 9, 9, 23, 45))).toEqual({ date: "2026-10-10", time: "12:00", meridiem: "AM" });
  });
});

describe("misc", () => {
  it("formats date input values", () => {
    expect(toDateInputValue(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("labels the browser timezone", () => {
    expect(getTimezoneLabel()).toMatch(/^\(GMT[+-]\d{1,2}(:\d{2})?\) \S+/);
  });
});
