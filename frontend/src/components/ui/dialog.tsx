"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Accessible modal built on Radix: focus is trapped inside, Escape closes it,
 * focus returns to the trigger, and title/description are announced.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  tone = "light",
  hideClose = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  tone?: "light" | "dark";
  hideClose?: boolean;
}) {
  const dark = tone === "dark";
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <RadixDialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-2xl focus:outline-none",
            dark ? "bg-room-panel text-room-text" : "bg-white text-ink",
            className,
          )}
        >
          <RadixDialog.Title className="pr-6 text-lg font-bold">{title}</RadixDialog.Title>
          {description ? (
            <RadixDialog.Description className={cn("mt-2 text-sm", dark ? "text-room-muted" : "text-ink-subtle")}>
              {description}
            </RadixDialog.Description>
          ) : (
            <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
          )}
          {children && <div className="mt-4">{children}</div>}
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
          {!hideClose && (
            <RadixDialog.Close
              aria-label="Close"
              className={cn(
                "absolute top-4 right-4 rounded-md p-1",
                dark ? "text-room-muted hover:bg-room-hover" : "text-ink-subtle hover:bg-surface-subtle",
              )}
            >
              <X className="size-5" aria-hidden />
            </RadixDialog.Close>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Slide-in side panel (mobile navigation), same accessibility guarantees as Dialog. */
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <RadixDialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col overflow-y-auto bg-sidebar shadow-2xl focus:outline-none">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <RadixDialog.Title className="text-base font-semibold">{title}</RadixDialog.Title>
            <RadixDialog.Description className="sr-only">Site navigation</RadixDialog.Description>
            <RadixDialog.Close aria-label="Close menu" className="rounded-md p-1 text-ink-subtle hover:bg-white">
              <X className="size-5" aria-hidden />
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
