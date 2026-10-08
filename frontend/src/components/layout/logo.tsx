import Link from "next/link";

import { cn } from "@/lib/cn";
import { routes } from "@/lib/constants";

/** Text-based product mark (original asset; swap in your own logo file if needed). */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href={routes.home} aria-label="Zoom Clone home" className={cn("flex items-center gap-1.5", className)}>
      <span className="text-[28px] leading-none font-extrabold tracking-tight text-zoom-blue">zoom</span>
      <span className="rounded bg-zoom-blue-soft px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-zoom-blue uppercase">
        clone
      </span>
    </Link>
  );
}
