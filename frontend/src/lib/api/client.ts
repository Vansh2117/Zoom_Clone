import type { ApiErrorCode, ApiErrorDetail } from "@/types/api";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  "",
);

/** Every failed request is turned into this one error type, so UI code never sees raw fetch errors. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: ApiErrorDetail[];

  constructor(status: number, code: ApiErrorCode, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Message for a specific form field, if the backend flagged it. */
  fieldError(field: string): string | undefined {
    return this.details.find((detail) => detail.field === field)?.message;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}/api${path}`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Unable to reach the server.");
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, payload);
  return payload as T;
}

function toApiError(status: number, payload: unknown): ApiError {
  const envelope = (payload as { error?: { code?: string; message?: string; details?: ApiErrorDetail[] } } | null)
    ?.error;
  if (envelope?.code) {
    return new ApiError(
      status,
      envelope.code as ApiErrorCode,
      envelope.message ?? "Request failed.",
      envelope.details ?? [],
    );
  }
  return new ApiError(status, status >= 500 ? "INTERNAL_ERROR" : "NOT_FOUND", "Request failed.");
}
