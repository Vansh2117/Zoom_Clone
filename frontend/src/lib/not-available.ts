import { toast } from "sonner";

/** Zoom's portal has many products; the clone renders them for fidelity but they are out of scope. */
export function showNotAvailable(feature: string): void {
  toast.info(`${feature} isn't available in this clone.`);
}
