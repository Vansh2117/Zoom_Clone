import { ChevronDown } from "lucide-react";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

const controlClass =
  "w-full rounded-lg border border-line bg-white px-3 text-[15px] text-ink placeholder:text-ink-subtle transition-colors hover:border-ink-subtle/60 focus:border-zoom-blue focus:outline-none focus:ring-2 focus:ring-zoom-blue/20 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-ink-subtle aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(controlClass, "h-10", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(controlClass, "min-h-24 py-2", className)} {...props} />;
  },
);

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }
>(function Select({ className, wrapperClassName, children, ...props }, ref) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select ref={ref} className={cn(controlClass, "h-10 appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-subtle"
      />
    </div>
  );
});

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] text-danger">
      {message}
    </p>
  );
}

interface FieldRenderProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
}

/**
 * Label + control + error, with the accessibility wiring done once:
 * `htmlFor`/`id`, `aria-invalid` and `aria-describedby` pointing at the error.
 */
export function FormField({
  label,
  error,
  required,
  className,
  layout = "stacked",
  children,
}: {
  label: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  layout?: "stacked" | "inline";
  children: (props: FieldRenderProps) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const inline = layout === "inline";

  return (
    <div className={cn(inline ? "grid gap-2 md:grid-cols-[170px_1fr] md:gap-4" : "flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-[15px] text-ink", inline && "md:pt-2.5")}>
        {required && (
          <span aria-hidden className="mr-1 text-danger">
            *
          </span>
        )}
        {label}
      </label>
      <div className="min-w-0">
        {children({ id, "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined })}
        <FieldError id={errorId} message={error} />
      </div>
    </div>
  );
}
