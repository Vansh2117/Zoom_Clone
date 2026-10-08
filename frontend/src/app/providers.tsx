"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { isApiError } from "@/lib/api/client";

function shouldRetry(failureCount: number, error: unknown): boolean {
  // 4xx answers are definitive (e.g. meeting not found) - retrying won't help.
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session; useState keeps it stable across renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: shouldRetry },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
