import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
export const E2E_API_URL = process.env.E2E_API_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["html", { outputFolder: "playwright-report" }], ["list"]]
    : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: E2E_BASE_URL,
    trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  globalSetup: path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "e2e/global-setup.ts",
  ),
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        locale: "vi-VN",
      },
    },
  ],
});
