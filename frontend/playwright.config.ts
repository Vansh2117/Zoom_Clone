import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests drive a real browser against the running app.
 * Start the backend first (see README), then run `npm run test:e2e`;
 * Playwright starts the Next.js dev server itself if it is not running.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Fake camera/mic so the pre-join preview and meeting room work headlessly.
        launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
        permissions: ["camera", "microphone", "clipboard-read", "clipboard-write"],
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
