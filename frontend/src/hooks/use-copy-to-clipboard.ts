"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

/**
 * Copy text with the Clipboard API. When it is unavailable (insecure origin,
 * old browser, permission denied) we expose `fallbackText` so the UI can show
 * the text in a read-only field for manual copying instead of failing silently.
 */
export function useCopyToClipboard() {
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  const copy = useCallback(async (text: string, successMessage = "Copied to clipboard") => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
      return true;
    } catch {
      setFallbackText(text);
      return false;
    }
  }, []);

  const dismissFallback = useCallback(() => setFallbackText(null), []);

  return { copy, fallbackText, dismissFallback };
}
