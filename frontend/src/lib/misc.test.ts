import { makeMeeting } from "@/test/utils";

import { routes } from "./constants";
import { buildInvitationText } from "./invitation";
import { galleryColumns, getParticipantRole } from "./participant";

describe("routes", () => {
  it("builds invite and pre-join links", () => {
    expect(routes.preJoin("8272914420")).toBe("/j/8272914420");
    expect(routes.preJoin("8272914420", { host: true })).toBe("/j/8272914420?role=host");
    expect(routes.preJoin("8272914420", { host: true, videoOff: true })).toBe("/j/8272914420?role=host&video=off");
    expect(routes.room("8272914420")).toBe("/meeting/8272914420");
  });
});

describe("buildInvitationText", () => {
  it("contains the topic, link and formatted meeting ID", () => {
    const text = buildInvitationText(makeMeeting());
    expect(text).toContain("Vansh Sharma is inviting you to a scheduled Zoom meeting.");
    expect(text).toContain("Topic: Weekly Team Sync");
    expect(text).toContain("http://localhost:3000/j/8272914420");
    expect(text).toContain("Meeting ID: 827 291 4420");
  });

  it("omits the time for instant meetings", () => {
    const text = buildInvitationText(makeMeeting({ is_instant: true }));
    expect(text).not.toContain("Time:");
    expect(text).toContain("inviting you to a Zoom meeting.");
  });
});

describe("participant helpers", () => {
  it("reads the role from LiveKit metadata", () => {
    expect(getParticipantRole('{"role":"host"}')).toBe("host");
    expect(getParticipantRole('{"role":"guest"}')).toBe("guest");
    expect(getParticipantRole(undefined)).toBe("guest");
    expect(getParticipantRole("not json")).toBe("guest");
  });

  it("chooses gallery columns", () => {
    expect([1, 2, 4, 5, 9, 10].map(galleryColumns)).toEqual([1, 2, 2, 3, 3, 4]);
  });
});
