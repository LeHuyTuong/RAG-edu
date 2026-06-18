import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

export const navigationMocks = {
  pathname: vi.fn(() => "/"),
  router: {
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  },
  searchParams: vi.fn(() => new URLSearchParams()),
  params: vi.fn(() => ({})),
};

Object.assign(globalThis, { navigationMocks });

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return React.createElement("img", props);
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () =>
    (
      globalThis as typeof globalThis & {
        navigationMocks: typeof navigationMocks;
      }
    ).navigationMocks.pathname(),
  useRouter: () =>
    (
      globalThis as typeof globalThis & {
        navigationMocks: typeof navigationMocks;
      }
    ).navigationMocks.router,
  useSearchParams: () =>
    (
      globalThis as typeof globalThis & {
        navigationMocks: typeof navigationMocks;
      }
    ).navigationMocks.searchParams(),
  useParams: () =>
    (
      globalThis as typeof globalThis & {
        navigationMocks: typeof navigationMocks;
      }
    ).navigationMocks.params(),
}));
