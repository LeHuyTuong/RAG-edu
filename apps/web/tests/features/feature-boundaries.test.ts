import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";

test("documents upload and RAG feature boundaries", () => {
  const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");

  expect(readme).toContain("src/features/documents");
  expect(readme).toContain("src/features/upload");
  expect(readme).toContain("src/features/rag");
  expect(readme).toContain("React Query");
});
