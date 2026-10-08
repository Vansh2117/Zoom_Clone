"use client";

import { Copy } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/cn";

import { Button } from "./button";
import { Dialog } from "./dialog";

/**
 * Copies `text` and shows a toast. If the Clipboard API is unavailable, opens a
 * dialog with the text pre-selected in a read-only field for manual copying.
 */
export function CopyButton({
  text,
  successMessage = "Copied to clipboard",
  label = "Copy",
  iconOnly = false,
  className,
  variant = "link",
  children,
}: {
  text: string;
  successMessage?: string;
  label?: string;
  iconOnly?: boolean;
  className?: string;
  variant?: "link" | "soft" | "secondary" | "ghost";
  children?: ReactNode;
}) {
  const { copy, fallbackText, dismissFallback } = useCopyToClipboard();

  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          aria-label={label}
          title={label}
          onClick={() => copy(text, successMessage)}
          className={cn("rounded-md p-1 text-ink-subtle hover:bg-surface-subtle hover:text-ink", className)}
        >
          <Copy className="size-4" aria-hidden />
        </button>
      ) : (
        <Button variant={variant} size="sm" className={className} onClick={() => copy(text, successMessage)}>
          {children ?? (
            <>
              <Copy className="size-4" aria-hidden />
              {label}
            </>
          )}
        </Button>
      )}
      <CopyFallbackDialog text={fallbackText} onClose={dismissFallback} />
    </>
  );
}

export function CopyFallbackDialog({ text, onClose }: { text: string | null; onClose: () => void }) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (text) requestAnimationFrame(() => fieldRef.current?.select());
  }, [text]);

  return (
    <Dialog
      open={text !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Copy manually"
      description="Your browser blocked automatic copying. The text is selected below; press Ctrl+C (or ⌘+C) to copy it."
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <label htmlFor="copy-fallback" className="sr-only">
        Text to copy
      </label>
      <textarea
        id="copy-fallback"
        ref={fieldRef}
        readOnly
        value={text ?? ""}
        rows={Math.min(8, (text ?? "").split("\n").length + 1)}
        className="w-full resize-none rounded-lg border border-line bg-surface-subtle p-3 font-mono text-sm"
        onFocus={(event) => event.currentTarget.select()}
      />
    </Dialog>
  );
}
