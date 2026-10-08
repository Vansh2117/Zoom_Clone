import {
  clearJoinSession,
  createIdentity,
  getOrCreateIdentity,
  getRememberedDisplayName,
  loadJoinSession,
  rememberDisplayName,
  saveJoinSession,
} from "./join-session";

const session = {
  identity: "1b4e28ba-2fa1-11d2-883f-0016d3cca427",
  displayName: "Priya",
  role: "guest" as const,
  audioEnabled: true,
  videoEnabled: false,
};

describe("join session", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("round-trips through sessionStorage", () => {
    saveJoinSession("8272914420", session);
    expect(loadJoinSession("8272914420")).toEqual(session);
  });

  it("is scoped per meeting", () => {
    saveJoinSession("8272914420", session);
    expect(loadJoinSession("1111111111")).toBeNull();
  });

  it("ignores corrupted data", () => {
    sessionStorage.setItem("zoom-clone:join:8272914420", "{not json");
    expect(loadJoinSession("8272914420")).toBeNull();
    sessionStorage.setItem("zoom-clone:join:8272914420", JSON.stringify({ identity: 1, role: "admin" }));
    expect(loadJoinSession("8272914420")).toBeNull();
  });

  it("can be cleared", () => {
    saveJoinSession("8272914420", session);
    clearJoinSession("8272914420");
    expect(loadJoinSession("8272914420")).toBeNull();
  });

  it("reuses the identity when rejoining the same meeting (refresh)", () => {
    saveJoinSession("8272914420", session);
    expect(getOrCreateIdentity("8272914420")).toBe(session.identity);
    expect(getOrCreateIdentity("1111111111")).not.toBe(session.identity);
  });

  it("creates identities the backend accepts", () => {
    for (let index = 0; index < 20; index += 1) {
      expect(createIdentity()).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    }
  });

  it("remembers the display name", () => {
    expect(getRememberedDisplayName()).toBe("");
    rememberDisplayName("Priya");
    expect(getRememberedDisplayName()).toBe("Priya");
  });
});
