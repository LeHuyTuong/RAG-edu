import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("documents the auth feature as the React Query reference slice", () => {
  const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");

  expect(readme).toContain("src/features/auth");
  expect(readme).toContain("React Query");
  expect(readme).toContain("Zustand");
});
