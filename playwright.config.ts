import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.CI ? "http://localhost:4322" : "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI
      ? "npm run build && npm run preview -- --port 4322"
      : "npm run dev",
    url: process.env.CI
      ? "http://localhost:4322/flashcards/test"
      : "http://localhost:4321/flashcards/test",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
