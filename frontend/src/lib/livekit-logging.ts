import { getLogger, LoggerNames } from "livekit-client";

/**
 * What livekit-client logs when the *server* closes our connection before we
 * do: the host ended the meeting or removed us. That is a normal way for a
 * meeting to finish, and the room's `onDisconnected` handler already shows the
 * right screen, so these are noise (and pop up Next.js' error overlay in dev).
 */
const SERVER_TEARDOWN_NOISE = [/DataChannel error on \w+: User-Initiated Abort/, /publisher data channel '\w+' closed unexpectedly/];

export function isServerTeardownNoise(message: unknown): boolean {
  return typeof message === "string" && SERVER_TEARDOWN_NOISE.some((pattern) => pattern.test(message));
}

let installed = false;

/** Drops only the messages above from livekit-client's engine logger; every other log is untouched. */
export function silenceServerTeardownLogs(): void {
  if (installed) return;
  installed = true;

  const logger = getLogger(LoggerNames.Engine);
  const createMethod = logger.methodFactory;
  logger.methodFactory = (methodName, level, loggerName) => {
    const log = createMethod(methodName, level, loggerName);
    if (methodName !== "error") return log;
    return (...args: unknown[]) => {
      if (!isServerTeardownNoise(args[0])) log(...args);
    };
  };
  // Re-create the logger's methods so the new factory takes effect.
  logger.rebuild();
}
