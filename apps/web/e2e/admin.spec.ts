import { test, expect } from "@playwright/test";
import { loginViaUI, TEST_USERS, navigateTo } from "./helpers";

test.describe("Admin Flows", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test.describe("Dashboard", () => {
    test("should display admin dashboard", async ({ page }) => {
      await expect(page).toHaveURL("/admin");
    });

    test("should have admin navigation sidebar", async ({ page }) => {
      await expect(page.getByText("Bảng điều khiển")).toBeVisible();
      await expect(page.getByText("Quản lý người dùng")).toBeVisible();
      await expect(page.getByText("Quản lý môn học")).toBeVisible();
    });
  });

  test.describe("Users Management", () => {
    test("should load users list page", async ({ page }) => {
      await navigateTo(page, "/admin/users");
      // Users page should show user list
      await expect(page).toHaveURL("/admin/users");
    });
  });

  test.describe("Subjects Management", () => {
    test("should load subjects page", async ({ page }) => {
      await navigateTo(page, "/admin/subjects");
      await expect(page).toHaveURL("/admin/subjects");
    });
  });

  test.describe("Settings", () => {
    test("should load admin settings page", async ({ page }) => {
      await navigateTo(page, "/admin/settings");
      await expect(page).toHaveURL("/admin/settings");
    });
  });
});
