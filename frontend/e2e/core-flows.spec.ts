import { expect, test } from "@playwright/test";

/**
 * Core flows against the real frontend + backend (start both first; see README).
 * These do not need LiveKit: they stop at the pre-join screen.
 */

test.describe("Dashboard", () => {
  test("shows the Zoom home layout with seeded data", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Vansh Sharma" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Meetings", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent activity" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Meeting" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Schedule", exact: true })).toBeVisible();
    await expect(page.getByText("Personal Meeting ID")).toBeVisible();
  });
});

test.describe("Schedule a meeting", () => {
  test("creates a meeting that appears in Upcoming", async ({ page }) => {
    const title = `E2E Review ${Date.now()}`;
    await page.goto("/meetings/schedule");

    await page.getByLabel(/Topic/).fill(title);
    await page.getByRole("button", { name: /Add Description/ }).click();
    await page.getByLabel("Description").fill("Created by Playwright");

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    await page.getByLabel("Date").fill(date);
    await page.getByLabel("Time", { exact: true }).selectOption("10:30");
    await page.getByLabel("AM or PM").selectOption("AM");
    await page.getByLabel("Duration").selectOption("45");
    await page.getByRole("button", { name: "Save" }).click();

    // Lands on the meeting details page with the invite link.
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText(/\/j\/\d{10}/)).toBeVisible();

    await page.goto("/meetings");
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  });

  test("blocks an empty topic", async ({ page }) => {
    await page.goto("/meetings/schedule");
    await page.getByLabel(/Topic/).fill("");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Topic is required.")).toBeVisible();
  });
});

test.describe("Join a meeting", () => {
  test("rejects a badly formatted ID without leaving the page", async ({ page }) => {
    await page.goto("/join");
    await page.getByLabel("Meeting ID or Invite Link").fill("123");
    await page.getByRole("button", { name: "Join" }).click();
    // Filtered by text: Next.js' route announcer is also an (empty) alert region.
    await expect(page.getByRole("alert").filter({ hasText: "9 to 11 digits" })).toBeVisible();
    await expect(page).toHaveURL(/\/join$/);
  });

  test("reports a meeting that does not exist", async ({ page }) => {
    await page.goto("/join");
    await page.getByLabel("Meeting ID or Invite Link").fill("999 999 9999");
    await page.getByRole("button", { name: "Join" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "not valid" })).toBeVisible();
  });

  test("an invite link opens the pre-join screen with camera preview and name", async ({ page, request }) => {
    const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8000";
    const meeting = await (await request.post(`${apiUrl}/api/meetings/instant`)).json();

    await page.goto(`/j/${meeting.meeting_code}`);

    await expect(page.getByRole("heading", { name: meeting.title })).toBeVisible();
    await expect(page.getByLabel("Your camera preview")).toBeAttached();
    await expect(page.getByRole("button", { name: "Mute microphone" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop video" })).toBeVisible();

    const join = page.getByRole("button", { name: "Join", exact: true });
    await page.getByLabel("Your Name").fill("");
    await expect(join).toBeDisabled();
    await page.getByLabel("Your Name").fill("Playwright Guest");
    await expect(join).toBeEnabled();

    // Clean up: end the meeting so it doesn't linger in Upcoming.
    await request.post(`${apiUrl}/api/meetings/${meeting.meeting_code}/end`);
  });

  test("an ended meeting cannot be joined", async ({ page, request }) => {
    const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8000";
    const meeting = await (await request.post(`${apiUrl}/api/meetings/instant`)).json();
    await request.post(`${apiUrl}/api/meetings/${meeting.meeting_code}/end`);

    await page.goto(`/j/${meeting.meeting_code}`);
    await expect(page.getByRole("heading", { name: "This meeting has been ended by the host" })).toBeVisible();
  });
});
