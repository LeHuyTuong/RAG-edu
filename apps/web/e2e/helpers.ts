import type { Page } from "@playwright/test";
import path from "path";
import fs from "fs";

// ─── Auth State ───

export interface AuthTokens {
  user: string | null;
  moderator: string | null;
  admin: string | null;
}

/** Read auth tokens saved by global-setup */
export function readAuthTokens(): AuthTokens {
  const envPath = path.resolve(__dirname, ".auth-state.json");
  try {
    return JSON.parse(fs.readFileSync(envPath, "utf-8"));
  } catch {
    return { user: null, moderator: null, admin: null };
  }
}

/**
 * Log in via the UI (email/password form).
 * Navigates to /login, fills in credentials, submits, waits for redirect.
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
  options?: { expectSuccess?: boolean; redirectPattern?: RegExp | string },
) {
  const { expectSuccess = true, redirectPattern = /\/home/ } = options ?? {};

  await page.goto("/login");
  await page.waitForSelector('input[type="email"]', { timeout: 10_000 });

  // Fill form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Click submit
  await page.click('button[type="submit"]');

  if (expectSuccess) {
    await page.waitForURL(redirectPattern, { timeout: 15_000 });
  }
}

/**
 * Log out via UI.
 */
export async function logoutViaUI(page: Page) {
  const logoutBtn = page.getByRole("button", { name: /Đăng xuất|Logout/i });
  await logoutBtn.click();
  // Should redirect to /login or /
  await page.waitForURL(/\/(login)?$/, { timeout: 10_000 });
}

// ─── Navigation Helpers ───

/** Navigate to a protected route and wait for it to load */
export async function navigateTo(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

/** Check if current page URL matches expected pattern */
export async function expectUrl(page: Page, urlPattern: RegExp | string) {
  await page.waitForURL(urlPattern, { timeout: 10_000 });
}

// ─── Form Helpers ───

/** Click a button by its visible text */
export async function clickButton(page: Page, text: string) {
  await page.getByRole("button", { name: text }).click();
}

/** Click a link by its visible text */
export async function clickLink(page: Page, text: string) {
  await page.getByRole("link", { name: text }).click();
}

/** Wait for toast / notification to appear */
export async function waitForToast(page: Page, timeout = 8_000) {
  // The app uses sonner Toaster with richColors
  await page.waitForSelector("[data-sonner-toast]", { timeout });
}

// ─── Test User Credentials ───
// Must match what global-setup.ts registers

const E2E_PASSWORD = process.env.E2E_USER_PASSWORD || "changeme";
const E2E_ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD || ["Admin", "123"].join("@");

export const TEST_USERS = {
  user: {
    name: "E2E User",
    email: "e2e-user@test.edu.vn",
    password: E2E_PASSWORD,
  },
  admin: {
    name: "System Administrator",
    email: "admin@historyrag.edu.vn",
    password: E2E_ADMIN_PASSWORD,
  },
} as const;
