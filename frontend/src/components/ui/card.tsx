import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/** White, rounded, softly shadowed panel used across the Zoom web portal. */
export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("rounded-xl bg-white shadow-card", className)} {...props} />;
}
