import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex items-center gap-2">
      <Loader2 aria-hidden className={cn("size-5 animate-spin", className)} />
      {label && <span className="text-sm text-ink-subtle">{label}</span>}
    </span>
  );
}

export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Spinner label={label} className="text-zoom-blue" />
    </div>
  );
}
