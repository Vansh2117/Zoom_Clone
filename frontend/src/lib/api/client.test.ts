import { errorResponse, jsonResponse } from "@/test/utils";

import { ApiError, apiRequest } from "./client";

describe("apiRequest", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON on success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));
    await expect(apiRequest("/me")).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/me", expect.objectContaining({ method: "GET" }));
  });

  it("sends JSON bodies", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }, 201));
    await apiRequest("/meetings", { method: "POST", body: { title: "x" } });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(JSON.stringify({ title: "x" }));
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("returns undefined for 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiRequest("/meetings/1234567890", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("turns the backend error envelope into an ApiError", async () => {
    fetchMock.mockResolvedValue(
      errorResponse(400, "VALIDATION_ERROR", "Title must not contain HTML tags", [
        { field: "title", message: "Title must not contain HTML tags" },
      ]),
    );

    const error = await apiRequest("/meetings").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect((error as ApiError).fieldError("title")).toBe("Title must not contain HTML tags");
  });

  it("reports an unreachable server as NETWORK_ERROR, never a raw TypeError", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(apiRequest("/me")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });

  it("handles non-JSON error bodies", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad Gateway</html>", { status: 502 }));
    await expect(apiRequest("/me")).rejects.toMatchObject({ code: "INTERNAL_ERROR", status: 502 });
  });
});
