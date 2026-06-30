import { test, expect } from "@playwright/test";
import { loginViaUI, TEST_USERS, navigateTo } from "./helpers";

test.describe("Moderator Flows", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(
      page,
      TEST_USERS.moderator.email,
      TEST_USERS.moderator.password,
    );
  });

  test.describe("Dashboard", () => {
    test("should display moderator dashboard", async ({ page }) => {
      await expect(page).toHaveURL("/moderator");
    });

    test("should have moderator navigation sidebar", async ({ page }) => {
      await expect(page.getByText("Bảng điều khiển")).toBeVisible();
      await expect(page.getByText("Duyệt tài liệu")).toBeVisible();
      await expect(page.getByText("Kiểm duyệt bài viết")).toBeVisible();
    });
  });

  test.describe("Documents Moderation", () => {
    test("should load documents moderation page", async ({ page }) => {
      await navigateTo(page, "/moderator/documents");
      await expect(page).toHaveURL("/moderator/documents");
    });
  });

  test.describe("Posts Moderation", () => {
    test("should load posts moderation page", async ({ page }) => {
      await navigateTo(page, "/moderator/posts");
      await expect(page).toHaveURL("/moderator/posts");
    });
  });

  test.describe("Settings", () => {
    test("should load moderator settings page", async ({ page }) => {
      await navigateTo(page, "/moderator/settings");
      await expect(page).toHaveURL("/moderator/settings");
    });
  });

  test.describe("Role Protection", () => {
    test("should not allow moderator to access admin pages", async ({
      page,
    }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/moderator|\/login/);
    });
  });
});
