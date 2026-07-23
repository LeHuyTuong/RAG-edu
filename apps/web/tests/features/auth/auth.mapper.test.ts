import { mapCurrentAccount } from "@/features/auth/lib/auth.mapper";

test("maps the Spring account response to the shared User model", () => {
  expect(
    mapCurrentAccount({
      id: "42",
      email: "student@example.com",
      name: "Nguyễn An",
      avatarUrl: null,
      role: "STUDENT",
      status: "ACTIVE",
      createdAt: "2026-07-01T09:00:00Z",
    }),
  ).toMatchObject({
    id: "42",
    email: "student@example.com",
    name: "Nguyễn An",
    role: "student",
    avatar: undefined,
    status: "ACTIVE",
  });
});
