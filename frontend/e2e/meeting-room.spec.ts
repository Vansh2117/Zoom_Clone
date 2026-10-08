import { expect, test } from "@playwright/test";

/**
 * Full meeting flow through LiveKit: host starts, guest joins, host ends for all.
 * Needs LiveKit keys in backend/.env, so it only runs with E2E_LIVEKIT=1.
 */
test.skip(!process.env.E2E_LIVEKIT, "Set E2E_LIVEKIT=1 (with LiveKit configured) to run the meeting room flow.");

test("host starts, guest joins, host ends the meeting for everyone", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  const guestConsoleErrors: string[] = [];
  guest.on("console", (message) => {
    if (message.type() === "error") guestConsoleErrors.push(message.text());
  });

  // Host: New Meeting -> pre-join -> Start Meeting.
  await host.goto("/");
  await host.getByRole("button", { name: "New Meeting" }).click();
  await expect(host).toHaveURL(/\/j\/\d{10}\?role=host/);
  const code = host.url().match(/\/j\/(\d{10})/)?.[1];
  await host.getByRole("button", { name: /Start Meeting|Join as Host/ }).click();
  await expect(host.getByRole("contentinfo", { name: "Meeting controls" })).toBeVisible({ timeout: 20_000 });

  // Guest: invite link -> name -> Join.
  await guest.goto(`/j/${code}`);
  await guest.getByLabel("Your Name").fill("Playwright Guest");
  await guest.getByRole("button", { name: "Join", exact: true }).click();
  await expect(guest.getByRole("contentinfo", { name: "Meeting controls" })).toBeVisible({ timeout: 20_000 });

  // Host sees the guest in the participants panel.
  await host.getByRole("button", { name: "Participants" }).click();
  await expect(host.getByRole("list").getByText("Playwright Guest")).toBeVisible({ timeout: 15_000 });

  // Host ends the meeting for all: the guest is told the meeting ended.
  await host.getByRole("button", { name: "End", exact: true }).click();
  await host.getByRole("button", { name: "End Meeting for All" }).click();
  await expect(host).toHaveURL(/\/$/);
  await expect(guest.getByRole("heading", { name: "This meeting has been ended by the host" })).toBeVisible({
    timeout: 15_000,
  });
  // The server closing the guest's connection is expected, so it must not be reported as an error.
  expect(guestConsoleErrors.filter((text) => /DataChannel|data channel/.test(text))).toEqual([]);

  await hostContext.close();
  await guestContext.close();
});
