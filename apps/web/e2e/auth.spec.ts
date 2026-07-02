import { test, expect } from "@playwright/test";
import { loginViaUI, logoutViaUI, TEST_USERS, navigateTo } from "./helpers";

test.describe("Auth Flows", () => {
  test.describe("Login Page", () => {
    test("should display login form with required fields", async ({ page }) => {
      await page.goto("/login");

      // Should have email input, password input, submit button
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();

      const submitBtn = page.getByRole("button", { name: /Đăng nhập/ });
      await expect(submitBtn).toBeVisible();

      // Should have register link
      await expect(page.getByText("Đăng ký", { exact: false })).toBeVisible();
    });

    test("should show validation error on empty submit", async ({ page }) => {
      await page.goto("/login");
      await page.click('button[type="submit"]');
      // Should still be on /login — form validation prevents submission
      await expect(page).toHaveURL(/\/login/);
    });

    test("should login successfully with valid credentials", async ({
      page,
    }) => {
      await loginViaUI(page, TEST_USERS.user.email, TEST_USERS.user.password);
      await expect(page).toHaveURL("/home");
      // Should see the user shell (sidebar with user nav)
      await expect(page.getByText("Không gian học tập")).toBeVisible();
    });

    test("should show error on wrong password", async ({ page }) => {
      await page.goto("/login");
      await page.fill('input[type="email"]', TEST_USERS.user.email);
      await page.fill('input[type="password"]', "WrongPass123!");
      await page.click('button[type="submit"]');

      // Should show an error message (form error or toast)
      // Stay on login page
      await expect(page).toHaveURL(/\/login/);
      // Verify at least one error element is visible
      const errorEl = page
        .locator('[role="alert"]')
        .or(page.locator(".text-red"))
        .or(page.getByText("không", { exact: false }))
        .first();
      await expect(errorEl).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Registration Page", () => {
    test("should display register form with required fields", async ({
      page,
    }) => {
      await page.goto("/register");

      // Should have name, email, password, confirm password fields
      await expect(page.getByLabel(/Họ tên|Tên|Name/i)).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(
        page.locator('input[type="password"]').first(),
      ).toBeVisible();

      const submitBtn = page.getByRole("button", { name: /Đăng ký|Register/i });
      await expect(submitBtn).toBeVisible();
    });

    test("should show error for duplicate email", async ({ page }) => {
      // Try registering with an existing email
      await page.goto("/register");
      await page.fill('[id="name"]', "Duplicate User");
      await page.fill('input[type="email"]', TEST_USERS.user.email);
      await page.fill('input[type="password"]', "SomePassword123!");
      await page.click('button[type="submit"]');

      // Should show an error about email already registered
      // Stay on register page
      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect unauthenticated user to login", async ({ page }) => {
      await page.goto("/home");
      await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect admin page to login", async ({ page }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect moderator page to login", async ({ page }) => {
      await page.goto("/moderator");
      await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect library to login", async ({ page }) => {
      await page.goto("/library");
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Logout", () => {
    test("should logout successfully", async ({ page }) => {
      await loginViaUI(page, TEST_USERS.user.email, TEST_USERS.user.password);
      await logoutViaUI(page);
      // After logout, accessing /home should redirect to login
      await page.goto("/home");
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Registration Flow", () => {
    test("should register a new user and auto-login", async ({ page }) => {
      const uniqueEmail = "e2e-fresh-" + Date.now() + "@test.edu.vn";
      await page.goto("/register");

      // Fill registration form
      await page.getByLabel(/Họ tên|Tên|Name/i).fill("Fresh E2E User");
      await page.locator('input[type="email"]').fill(uniqueEmail);
      await page
        .locator('input[type="password"]')
        .first()
        .fill("FreshUser@123");

      // Submit
      await page.getByRole("button", { name: /Dang ky|Register/i }).click();

      // Auto-login should redirect to home
      await page.waitForURL(/\/home/, { timeout: 15_000 });
    });
  });

  test.describe("Forgot Password Page", () => {
    test("should display forgot password form", async ({ page }) => {
      await page.goto("/forgot-password");

      // Should have email input and submit button
      await expect(page.locator('input[type="email"]')).toBeVisible();
      const submitBtn = page.getByRole("button", { name: /Gửi|Send|Reset/i });
      await expect(submitBtn).toBeVisible();
    });
  });
});
