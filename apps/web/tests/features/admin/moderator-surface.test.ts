import { expect, test } from "vitest";

import { ADMIN_NAV_ITEMS, USER_NAV_ITEMS } from "@/constants/nav.const";
import { ROUTE_PATHS } from "@/routes/router.const";

test("does not publish unsupported moderator navigation or routes", () => {
  expect([...ADMIN_NAV_ITEMS, ...USER_NAV_ITEMS]).not.toContainEqual(
    expect.objectContaining({ href: expect.stringContaining("/moderator") }),
  );
  expect(ROUTE_PATHS).not.toHaveProperty("MODERATOR");
});
