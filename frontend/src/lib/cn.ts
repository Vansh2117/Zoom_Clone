import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Compose Tailwind classes; later classes win over conflicting earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
