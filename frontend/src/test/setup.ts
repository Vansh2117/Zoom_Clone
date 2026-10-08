import "@testing-library/jest-dom/vitest";

import { createElement, type ReactNode } from "react";
import { afterEach, vi } from "vitest";

// Next.js modules need the framework runtime; replace them with light stand-ins.
vi.mock("next/navigation", async () => {
  const { mockRouter } = await import("./router");
  return {
    useRouter: () => mockRouter,
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
    notFound: vi.fn(),
  };
});

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...props }, children),
}));

// jsdom gaps used by Radix and sonner.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

afterEach(() => {
  vi.clearAllMocks();
});
