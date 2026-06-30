import { test, expect } from "@playwright/test";
import { loginViaUI, TEST_USERS, navigateTo } from "./helpers";

test.describe("User Flows", () => {
  test.describe("Landing Page", () => {
    test("should display the landing page", async ({ page }) => {
      await page.goto("/");
      // The landing page should load without error
      await expect(page).toHaveURL("/");
      // Should have some visible content
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, TEST_USERS.user.email, TEST_USERS.user.password);
  });

  test.describe("Home Page", () => {
    test("should display user home with welcome message", async ({ page }) => {
      await expect(page).toHaveURL("/home");
      // Should show the user shell with title
      await expect(page.getByText("Không gian học tập")).toBeVisible();
    });

    test("should have working navigation sidebar", async ({ page }) => {
      // Check that user nav items are visible
      await expect(page.getByText("Trang chủ")).toBeVisible();
      await expect(page.getByText("Thư viện")).toBeVisible();
      await expect(page.getByText("Tài liệu của tôi")).toBeVisible();
      await expect(page.getByText("Đóng góp")).toBeVisible();
      await expect(page.getByText("Cài đặt")).toBeVisible();
    });
  });

  test.describe("Library Page", () => {
    test("should load library page with document list", async ({ page }) => {
      await navigateTo(page, "/library");
      // Library should have a heading or document grid
      await expect(page.getByText("Thư viện", { exact: false })).toBeVisible();
    });
  });

  test.describe("My Documents Page", () => {
    test("should load my documents page", async ({ page }) => {
      await navigateTo(page, "/my-documents");
      // Should have a title about my documents
      await expect(page.getByText("Tài liệu của tôi")).toBeVisible();
    });
  });

  test.describe("Uploads Page", () => {
    test("should load uploads page", async ({ page }) => {
      await navigateTo(page, "/uploads");
      // Uploads page should show upload form
      await expect(page.getByText("Đóng góp", { exact: false })).toBeVisible();
    });
  });

  test.describe("Profile Page", () => {
    test("should load profile page", async ({ page }) => {
      await navigateTo(page, "/profile");
      // Profile page should show user info
      await expect(page.getByText("Hồ sơ", { exact: false })).toBeVisible();
    });
  });

  test.describe("Settings Page", () => {
    test("should load settings page", async ({ page }) => {
      await navigateTo(page, "/settings");
      // Settings page should show settings form
      await expect(page.getByText("Cài đặt", { exact: false })).toBeVisible();
    });
  });

  test.describe("Role Protection", () => {
    test("should not allow regular user to access admin pages", async ({
      page,
    }) => {
      await page.goto("/admin");
      // Should redirect away (either to home or show forbidden)
      await expect(page).toHaveURL(/\/home|\/login/);
    });

    test("should not allow regular user to access moderator pages", async ({
      page,
    }) => {
      await page.goto("/moderator");
      // Should redirect away
      await expect(page).toHaveURL(/\/home|\/login/);
    });
  });
});
