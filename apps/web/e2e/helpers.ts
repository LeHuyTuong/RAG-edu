import type { Page } from "@playwright/test";

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
