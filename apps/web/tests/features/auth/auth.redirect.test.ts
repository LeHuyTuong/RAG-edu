import {
  getLoginRedirectHref,
  getSafeRedirect,
} from "@/features/auth/lib/auth.redirect";

test("uses the role home when the redirect target is unsafe", () => {
  expect(getSafeRedirect("//evil.example", "student")).toBe("/home");
});

test("keeps a same-origin redirect target", () => {
  expect(getSafeRedirect("/documents/123", "student")).toBe("/documents/123");
});

test("creates a login redirect for protected paths", () => {
  expect(getLoginRedirectHref("/profile", "?tab=account")).toBe(
    "/login?redirect=%2Fprofile%3Ftab%3Daccount",
  );
});
