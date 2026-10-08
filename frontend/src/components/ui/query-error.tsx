import { AlertCircle } from "lucide-react";

import { getErrorMessage } from "@/lib/errors";

import { Button } from "./button";
import { StateMessage } from "./state-message";

/** Error state with a retry button, e.g. when the backend is down. */
export function QueryError({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  return (
    <StateMessage
      role="alert"
      className={className}
      icon={<AlertCircle className="size-8 text-danger" aria-hidden />}
      title="Couldn't load this"
      description={getErrorMessage(error)}
      action={
        onRetry && (
          <Button variant="soft" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
}
