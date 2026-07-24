// Captures reference screenshots of key app pages for the root README.
// Requires the full local stack running: `docker compose up` (or backend +
// web dev server on their default ports).
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? "http://localhost:8080/api/v1";
const ADMIN_EMAIL = "admin@historyrag.edu.vn";
const ADMIN_PASSWORD = "Admin@123";

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../docs/screenshots",
);

async function registerStudent() {
  const email = `e2e-shot-${Date.now()}@historyrag.edu.vn`;
  const password = "Screenshot@123";
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "E2E Screenshot User", email, password }),
  });
  if (!res.ok) {
    throw new Error(`Register failed: ${res.status} ${await res.text()}`);
  }
  return { email, password };
}

async function login(page, email, password) {
  await page.goto(`${WEB_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/home|\/admin/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
}

async function dismissCookieBanner(page) {
  const acceptButton = page.getByRole("button", { name: "Đồng ý" });
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
  }
}

async function shoot(page, name) {
  await page.waitForLoadState("networkidle");
  // Let skeleton loaders resolve and dev-mode "Compiling..." toasts fade.
  await page.waitForTimeout(1500);
  await dismissCookieBanner(page);
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  console.log(`saved ${name}.png`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const student = await registerStudent();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(`${WEB_URL}/`);
  await page.waitForLoadState("networkidle");
  await shoot(page, "landing");

  await page.goto(`${WEB_URL}/login`);
  await page.waitForLoadState("networkidle");
  await shoot(page, "login");

  await login(page, student.email, student.password);
  await shoot(page, "home");

  // Client-side nav (not page.goto): a hard reload on a protected route
  // bounces to /login while the persisted auth store is still rehydrating.
  await page.getByRole("link", { name: /Thư viện/ }).click();
  await page.waitForURL(/\/library/);
  await page.waitForLoadState("networkidle");
  await shoot(page, "library");

  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await shoot(page, "admin-dashboard");

  await browser.close();
  console.log(`\nScreenshots saved to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
