import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const TONES = {
  live: "bg-[#e6f7ed] text-[#0f7a3a]",
  neutral: "bg-surface-subtle text-ink-subtle",
  info: "bg-zoom-blue-soft text-zoom-blue",
  warning: "bg-warning-soft text-[#a15c00]",
} as const;

export function Badge({ tone = "neutral", children, className }: { tone?: keyof typeof TONES; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", TONES[tone], className)}>
      {children}
    </span>
  );
}
