import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 90000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
    headless: true,
    viewport: { width: 1440, height: 960 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: { channel: "chrome" },
  },
  reporter: "list",
});
