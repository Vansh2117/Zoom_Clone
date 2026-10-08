import { vi } from "vitest";

/** Shared stand-in for Next's router; tests assert on `mockRouter.push`. */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};
