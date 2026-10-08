import type { ReactNode } from "react";

/** Dark full-screen message used before/after a meeting (ended, removed, waiting…). */
export function FullScreenNotice({
  icon,
  title,
  description,
  actions,
  children,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-room px-6 text-center text-room-text">
      {icon}
      <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
      {description && <p className="max-w-md text-[15px] text-room-muted">{description}</p>}
      {children}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div>}
    </main>
  );
}
