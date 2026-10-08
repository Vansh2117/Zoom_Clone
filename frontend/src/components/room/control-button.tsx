import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Icon-over-label button in Zoom's bottom meeting toolbar. */
export function ControlButton({
  icon: Icon,
  label,
  onClick,
  off = false,
  active = false,
  pressed,
  disabled,
  badge,
  tone = "default",
  shortcut,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  /** Red-tinted icon (e.g. muted microphone). */
  off?: boolean;
  /** Highlighted (e.g. panel open). */
  active?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  badge?: ReactNode;
  tone?: "default" | "share";
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-keyshortcuts={shortcut}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        "relative flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-room-text transition-colors hover:bg-room-hover disabled:opacity-50 md:min-w-[72px]",
        active && "bg-room-hover",
      )}
    >
      <span
        className={cn(
          "relative flex size-7 items-center justify-center rounded-md",
          tone === "share" && "bg-share text-white",
        )}
      >
        <Icon className={cn("size-[22px]", off && "text-danger")} aria-hidden />
        {badge}
      </span>
      <span className="hidden text-[11px] leading-none sm:block">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  );
}

export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] leading-4 font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
