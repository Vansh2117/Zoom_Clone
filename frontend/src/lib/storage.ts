/**
 * Safe wrappers around Web Storage. Storage can throw (private mode, blocked
 * cookies) or be absent (server render), and none of that should crash the app.
 */

type StorageKind = "local" | "session";

function getStorage(kind: StorageKind): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJson<T>(kind: StorageKind, key: string): T | null {
  try {
    const raw = getStorage(kind)?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(kind: StorageKind, key: string, value: unknown): void {
  try {
    getStorage(kind)?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the feature degrades gracefully.
  }
}

export function removeItem(kind: StorageKind, key: string): void {
  try {
    getStorage(kind)?.removeItem(key);
  } catch {
    // ignore
  }
}
