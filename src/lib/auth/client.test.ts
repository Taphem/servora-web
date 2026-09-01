import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiRequest, ApiError, ClientErrorCode } from "@/lib/auth/client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("always sends credentials: include, per the cookie-session contract", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ok: true }));
    await apiRequest("/api/v1/auth/session");
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init).toMatchObject({ credentials: "include" });
  });

  it("returns the parsed JSON body on success", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ userId: "u1", email: "a@b.com" }));
    const result = await apiRequest<{ userId: string }>("/api/v1/auth/session");
    expect(result).toEqual({ userId: "u1", email: "a@b.com" });
  });

  it("treats 204 as an empty success without parsing a body", async () => {
    const res = new Response(null, { status: 204 });
    vi.mocked(fetch).mockResolvedValue(res);
    const result = await apiRequest("/api/v1/auth/logout", { method: "POST" });
    expect(result).toBeUndefined();
  });

  it("throws ApiError with the backend's code/message/requestId on a non-2xx envelope", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        { error: { code: "TOKEN_INVALID", message: "This verification link is invalid or has expired.", requestId: "req_1" } },
        400,
      ),
    );
    await expect(apiRequest("/api/v1/auth/email/verify", { method: "POST", body: { token: "x" } })).rejects.toMatchObject({
      code: "TOKEN_INVALID",
      status: 400,
      requestId: "req_1",
    });
  });

  it("throws a synthetic ClientErrorCode.NetworkError when fetch itself rejects, without logging anything", async () => {
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(apiRequest("/api/v1/auth/session")).rejects.toMatchObject({
      code: ClientErrorCode.NetworkError,
    });
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("throws ClientErrorCode.MalformedResponse for a non-ok response that isn't the error envelope", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("<html>502</html>", { status: 502 }));
    await expect(apiRequest("/api/v1/auth/session")).rejects.toMatchObject({
      code: ClientErrorCode.MalformedResponse,
      status: 502,
    });
  });

  it("never logs the request body (e.g. a verification token) anywhere", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ verified: true }));

    await apiRequest("/api/v1/auth/email/verify", { method: "POST", body: { token: "super-secret-token" } });

    const allLoggedText = [...logSpy.mock.calls, ...errorSpy.mock.calls].flat().join(" ");
    expect(allLoggedText).not.toContain("super-secret-token");
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("ApiError instances carry a code/status distinguishable from a plain Error", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: { code: "RATE_LIMITED", message: "Slow down." } }, 429));
    try {
      await apiRequest("/api/v1/auth/login", { method: "POST", body: { email: "a@b.com", password: "x" } });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe("RATE_LIMITED");
    }
  });
});
