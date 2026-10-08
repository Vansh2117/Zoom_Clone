import { isValidMeetingCode, parseMeetingInput, validateDisplayName, validateScheduleForm } from "./validation";

describe("parseMeetingInput", () => {
  it("accepts a plain 10-digit meeting ID", () => {
    expect(parseMeetingInput("8272914420")).toEqual({ ok: true, code: "8272914420" });
  });

  it("strips spaces and dashes like Zoom's join box", () => {
    expect(parseMeetingInput(" 827 291 4420 ")).toEqual({ ok: true, code: "8272914420" });
    expect(parseMeetingInput("827-291-4420")).toEqual({ ok: true, code: "8272914420" });
  });

  it("extracts the code from a pasted invite link", () => {
    expect(parseMeetingInput("https://zoom-clone.app/j/8272914420")).toEqual({ ok: true, code: "8272914420" });
    expect(parseMeetingInput("http://localhost:3000/j/827291442?role=host")).toEqual({ ok: true, code: "827291442" });
    expect(parseMeetingInput("http://localhost:3000/meeting/82729144201")).toEqual({ ok: true, code: "82729144201" });
  });

  it("rejects empty input", () => {
    expect(parseMeetingInput("   ")).toMatchObject({ ok: false });
  });

  it("rejects letters", () => {
    const result = parseMeetingInput("abc123");
    expect(result.ok).toBe(false);
  });

  it("rejects IDs that are too short or too long", () => {
    expect(parseMeetingInput("12345678")).toMatchObject({ ok: false, error: "A meeting ID has 9 to 11 digits." });
    expect(parseMeetingInput("123456789012")).toMatchObject({ ok: false });
  });
});

describe("isValidMeetingCode", () => {
  it("matches only 9-11 digit strings", () => {
    expect(isValidMeetingCode("123456789")).toBe(true);
    expect(isValidMeetingCode("12345678901")).toBe(true);
    expect(isValidMeetingCode("12345678")).toBe(false);
    expect(isValidMeetingCode("12345abcde")).toBe(false);
  });
});

describe("validateDisplayName", () => {
  it("requires a name", () => {
    expect(validateDisplayName("  ")).toBe("Please enter your name.");
  });

  it("limits the name to 50 characters", () => {
    expect(validateDisplayName("x".repeat(50))).toBeNull();
    expect(validateDisplayName("x".repeat(51))).toMatch(/50 characters/);
  });

  it("rejects HTML but allows ordinary punctuation", () => {
    expect(validateDisplayName("<script>alert(1)</script>")).toMatch(/HTML/);
    expect(validateDisplayName("Priya <3")).toBeNull();
    expect(validateDisplayName("O'Brien")).toBeNull();
  });
});

describe("validateScheduleForm", () => {
  const now = new Date(2026, 9, 9, 10, 0);
  const valid = { title: "Sync", description: "", startsAt: new Date(2026, 9, 9, 11, 0), durationMinutes: 30 };

  it("passes a valid form", () => {
    expect(validateScheduleForm(valid, now)).toEqual({});
  });

  it("requires a topic", () => {
    expect(validateScheduleForm({ ...valid, title: "   " }, now).title).toBe("Topic is required.");
  });

  it("rejects HTML in topic and description", () => {
    const errors = validateScheduleForm({ ...valid, title: "<b>x</b>", description: "<img src=x>" }, now);
    expect(errors.title).toMatch(/HTML/);
    expect(errors.description).toMatch(/HTML/);
  });

  it("rejects times in the past or missing", () => {
    expect(validateScheduleForm({ ...valid, startsAt: new Date(2026, 9, 9, 9, 30) }, now).startsAt).toMatch(/future/);
    expect(validateScheduleForm({ ...valid, startsAt: null }, now).startsAt).toMatch(/choose/);
  });
});
