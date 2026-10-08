import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

import { Spinner } from "./spinner";

const VARIANTS = {
  primary: "bg-zoom-blue text-white hover:bg-zoom-blue-hover disabled:bg-zoom-blue/50",
  soft: "bg-zoom-blue-soft text-zoom-blue hover:bg-zoom-blue-soft-hover disabled:opacity-60",
  secondary: "border border-line bg-white text-ink hover:bg-surface-subtle disabled:opacity-60",
  danger: "bg-danger text-white hover:bg-danger-hover disabled:bg-danger/50",
  ghost: "text-ink-muted hover:bg-surface-subtle disabled:opacity-60",
  link: "px-0 text-zoom-blue hover:underline disabled:opacity-60",
} as const;

const SIZES = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, disabled, className, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        variant === "link" && "h-auto",
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});
