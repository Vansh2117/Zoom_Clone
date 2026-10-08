import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { Toaster } from "sonner";
import { vi } from "vitest";

import type { Meeting } from "@/types/api";

/** Render with the same providers as the app, minus retries (tests should fail fast). */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    );
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}

export function makeMeeting(overrides: Partial<Meeting> = {}): Meeting {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  start.setMinutes(30, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return {
    meeting_code: "8272914420",
    title: "Weekly Team Sync",
    description: null,
    status: "scheduled",
    is_instant: false,
    scheduled_at: start.toISOString(),
    scheduled_end_at: end.toISOString(),
    duration_minutes: 30,
    created_at: new Date().toISOString(),
    started_at: null,
    ended_at: null,
    host: { id: 1, name: "Vansh Sharma" },
    participant_count: 0,
    invite_url: "http://localhost:3000/j/8272914420",
    ...overrides,
  };
}

/** A fetch Response with a JSON body. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(status: number, code: string, message: string, details: unknown[] = []): Response {
  return jsonResponse({ error: { code, message, details } }, status);
}

type Handler = () => Response | Promise<Response>;

/**
 * Stub `fetch` with handlers keyed by "METHOD /path" (path without the /api prefix),
 * e.g. { "GET /meetings/upcoming": () => jsonResponse([]) }. Unknown routes 404.
 */
export function mockApi(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    const key = `${init?.method ?? "GET"} ${url.pathname.replace(/^\/api/, "")}`;
    const handler = handlers[key];
    return handler ? handler() : errorResponse(404, "NOT_FOUND", `No mock for ${key}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Calls made to a given "METHOD /path" key. */
export function callsTo(fetchMock: ReturnType<typeof mockApi>, key: string) {
  return fetchMock.mock.calls.filter(([input, init]) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    return `${init?.method ?? "GET"} ${url.pathname.replace(/^\/api/, "")}` === key;
  });
}

export const defaultUser = {
  id: 1,
  name: "Vansh Sharma",
  email: "vansh.sharma@example.com",
  personal_meeting_id: "3297597040",
};
