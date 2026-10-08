import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Consistent block for empty, error and info states (never a blank screen). */
export function StateMessage({
  icon,
  title,
  description,
  action,
  className,
  role,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  return (
    <div role={role} className={cn("flex flex-col items-center justify-center gap-2 px-4 py-8 text-center", className)}>
      {icon}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-subtle">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
