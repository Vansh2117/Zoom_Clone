import { getLogger, LoggerNames } from "livekit-client";

import { isServerTeardownNoise, silenceServerTeardownLogs } from "./livekit-logging";

describe("isServerTeardownNoise", () => {
  it("matches the data channel messages logged when the server closes the connection", () => {
    expect(isServerTeardownNoise("DataChannel error on lossy: User-Initiated Abort, reason=")).toBe(true);
    expect(isServerTeardownNoise("DataChannel error on reliable: User-Initiated Abort, reason=")).toBe(true);
    expect(isServerTeardownNoise("publisher data channel 'DATA_TRACK_LOSSY' closed unexpectedly")).toBe(true);
  });

  it("leaves every other message alone", () => {
    expect(isServerTeardownNoise("Unknown DataChannel error on reliable")).toBe(false);
    expect(isServerTeardownNoise("could not connect")).toBe(false);
    expect(isServerTeardownNoise(new Error("boom"))).toBe(false);
  });
});

describe("silenceServerTeardownLogs", () => {
  it("drops the noise from the engine logger but still logs real errors", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    silenceServerTeardownLogs();
    const logger = getLogger(LoggerNames.Engine);

    logger.error("publisher data channel 'RELIABLE' closed unexpectedly");
    expect(consoleError).not.toHaveBeenCalled();

    logger.error("could not connect");
    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
