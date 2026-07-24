// Captures a screenshot of the AI chatbot answering a question, for the
// root README. Requires the full local stack running.
//
// Credentials are read from env vars, never hardcoded, since this logs in
// as a real account (not a disposable e2e user) to demo real folder data:
//   DEMO_EMAIL=... DEMO_PASSWORD=... pnpm --filter web chatbot-screenshot
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
const EMAIL = process.env.DEMO_EMAIL;
const PASSWORD = process.env.DEMO_PASSWORD;
const FOLDER_NAME = process.env.DEMO_FOLDER_NAME ?? "Lịch Sử";
const QUESTION =
  process.env.DEMO_QUESTION ??
  "Tóm tắt ngắn gọn nội dung các tài liệu này bằng 3 gạch đầu dòng.";

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../docs/screenshots",
);

if (!EMAIL || !PASSWORD) {
  console.error("Set DEMO_EMAIL and DEMO_PASSWORD env vars before running.");
  process.exit(1);
}

async function dismissCookieBanner(page) {
  const acceptButton = page.getByRole("button", { name: "Đồng ý" });
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(`${WEB_URL}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/home|\/admin/, { timeout: 15_000 });

  await page.getByRole("link", { name: /Thư mục/ }).click();
  await page.waitForURL(/\/folders$/);
  await page.waitForLoadState("networkidle");

  await page.getByText(FOLDER_NAME, { exact: true }).click();
  await page.waitForURL(/\/folders\/\d+/, { timeout: 10_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await dismissCookieBanner(page);

  await page.locator("textarea").fill(QUESTION);
  await page.getByRole("button", { name: "Gửi câu hỏi" }).click();

  await page
    .waitForSelector('button[aria-label="Dừng phản hồi"]', {
      state: "detached",
      timeout: 60_000,
    })
    .catch(() => {});
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(outDir, "chatbot.png") });
  console.log(`saved chatbot.png to ${outDir}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
