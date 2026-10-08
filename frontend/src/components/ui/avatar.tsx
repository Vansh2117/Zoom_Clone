import { cn } from "@/lib/cn";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

const PALETTE = ["#0b5cff", "#7b61ff", "#00a3a3", "#e8590c", "#d6336c", "#2f9e44", "#5c7cfa", "#ae3ec9"];

/** Stable colour per name, so a participant keeps the same avatar colour everywhere. */
export function colorForName(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({
  name,
  className,
  variant = "colored",
}: {
  name: string;
  className?: string;
  variant?: "colored" | "dark";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-white select-none",
        className,
      )}
      style={{ backgroundColor: variant === "dark" ? "#131619" : colorForName(name) }}
    >
      {getInitials(name)}
    </span>
  );
}
