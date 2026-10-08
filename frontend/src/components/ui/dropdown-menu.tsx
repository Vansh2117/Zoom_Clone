"use client";

import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface MenuItem {
  label: ReactNode;
  onSelect: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

/** Keyboard-navigable dropdown (arrow keys, Enter, Escape) built on Radix. */
export function DropdownMenu({
  trigger,
  items,
  align = "end",
  label,
  tone = "light",
}: {
  trigger: ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  label?: ReactNode;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          sideOffset={6}
          className={cn(
            "z-50 min-w-[200px] rounded-lg border p-1 shadow-lg",
            dark ? "border-room-hover bg-room-panel text-room-text" : "border-line bg-white text-ink",
          )}
        >
          {label && (
            <RadixMenu.Label className={cn("px-3 py-2 text-xs", dark ? "text-room-muted" : "text-ink-subtle")}>
              {label}
            </RadixMenu.Label>
          )}
          {items.map((item, index) => (
            <RadixMenu.Item
              key={index}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                dark ? "data-[highlighted]:bg-room-hover" : "data-[highlighted]:bg-surface-subtle",
                item.danger && "text-danger",
              )}
            >
              {item.icon}
              {item.label}
            </RadixMenu.Item>
          ))}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
