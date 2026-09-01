import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiRequest } from "@/lib/auth/client";
import {
  register,
  login,
  logout,
  getSession,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  confirmPasswordReset,
} from "@/lib/auth/api";

vi.mock("@/lib/auth/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/client")>();
  return { ...actual, apiRequest: vi.fn() };
});

const mockedApiRequest = vi.mocked(apiRequest);

describe("auth api wrappers call the real, verified gateway contract", () => {
  beforeEach(() => {
    mockedApiRequest.mockReset();
    mockedApiRequest.mockResolvedValue(undefined);
  });

  it("register: POST /api/v1/auth/register with only email + password", async () => {
    await register("user@example.com", "hunter2hunter2");
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/register", {
      method: "POST",
      body: { email: "user@example.com", password: "hunter2hunter2" },
    });
  });

  it("login: POST /api/v1/auth/login with email + password", async () => {
    await login("user@example.com", "whatever");
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/login", {
      method: "POST",
      body: { email: "user@example.com", password: "whatever" },
    });
  });

  it("logout: POST /api/v1/auth/logout with no body", async () => {
    await logout();
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/logout", { method: "POST" });
  });

  it("getSession: GET /api/v1/auth/session", async () => {
    await getSession();
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/session");
  });

  it("verifyEmail: POST /api/v1/auth/email/verify with the token in the JSON body", async () => {
    await verifyEmail("the-token-value");
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/email/verify", {
      method: "POST",
      body: { token: "the-token-value" },
    });
  });

  it("resendVerificationEmail: POST /api/v1/auth/email/resend with the email", async () => {
    await resendVerificationEmail("user@example.com");
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/email/resend", {
      method: "POST",
      body: { email: "user@example.com" },
    });
  });

  it("requestPasswordReset: POST /api/v1/auth/password/reset/request with the email", async () => {
    await requestPasswordReset("user@example.com");
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/password/reset/request", {
      method: "POST",
      body: { email: "user@example.com" },
    });
  });

  it("confirmPasswordReset: POST /api/v1/auth/password/reset/confirm with token + newPassword", async () => {
    await confirmPasswordReset("reset-token", "new-password-123");
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/password/reset/confirm", {
      method: "POST",
      body: { token: "reset-token", newPassword: "new-password-123" },
    });
  });
});
