import { ApiError } from "./api/client";
import { getErrorMessage, hasErrorCode } from "./errors";

describe("getErrorMessage", () => {
  it("maps error codes to friendly copy", () => {
    expect(getErrorMessage(new ApiError(404, "MEETING_NOT_FOUND", "raw"))).toBe(
      "This meeting ID is not valid. Please check and try again.",
    );
    expect(getErrorMessage(new ApiError(410, "MEETING_ENDED", "raw"))).toBe("This meeting has been ended by the host.");
    expect(getErrorMessage(new ApiError(0, "NETWORK_ERROR", "raw"))).toMatch(/Can't connect/);
  });

  it("shows the backend's message for validation errors", () => {
    expect(getErrorMessage(new ApiError(400, "VALIDATION_ERROR", "Meeting time must be in the future"))).toBe(
      "Meeting time must be in the future",
    );
  });

  it("never leaks unknown errors", () => {
    expect(getErrorMessage(new Error("TypeError: x is undefined"))).toBe("Something went wrong. Please try again.");
    expect(getErrorMessage("boom")).toBe("Something went wrong. Please try again.");
  });
});

describe("hasErrorCode", () => {
  it("checks the code of ApiErrors only", () => {
    expect(hasErrorCode(new ApiError(409, "MEETING_NOT_STARTED", ""), "MEETING_NOT_STARTED")).toBe(true);
    expect(hasErrorCode(new ApiError(409, "MEETING_NOT_STARTED", ""), "MEETING_ENDED")).toBe(false);
    expect(hasErrorCode(new Error("x"), "MEETING_ENDED")).toBe(false);
  });
});
