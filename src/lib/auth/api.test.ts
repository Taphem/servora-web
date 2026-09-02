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
  requestPhoneOtp,
  verifyPhoneOtp,
  authenticateWithGoogle,
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

  it("register: POST /api/v1/auth/register with only email + password when no phone is given", async () => {
    await register("user@example.com", "hunter2hunter2");
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/register", {
      method: "POST",
      body: { email: "user@example.com", password: "hunter2hunter2" },
    });
    // The call must not carry a `phone` key at all — not even `phone: undefined`.
    const [, options] = mockedApiRequest.mock.calls[0];
    expect(Object.prototype.hasOwnProperty.call((options as { body: object }).body, "phone")).toBe(false);
  });

  it("register: includes phone in the body when one is given", async () => {
    await register("user@example.com", "hunter2hunter2", "+14155552671");
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/register", {
      method: "POST",
      body: { email: "user@example.com", password: "hunter2hunter2", phone: "+14155552671" },
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

  it("requestPhoneOtp: POST /api/v1/auth/phone/otp/request with an EXACTLY empty body — never a phone number", async () => {
    await requestPhoneOtp();
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/phone/otp/request", {
      method: "POST",
      body: {},
    });
  });

  it("verifyPhoneOtp: POST /api/v1/auth/phone/otp/verify with only the otp", async () => {
    await verifyPhoneOtp("123456");
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/phone/otp/verify", {
      method: "POST",
      body: { otp: "123456" },
    });
  });

  it("authenticateWithGoogle: POST /api/v1/auth/google with exactly { credential } — no email/password", async () => {
    await authenticateWithGoogle("the-google-id-token");
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/v1/auth/google", {
      method: "POST",
      body: { credential: "the-google-id-token" },
    });
    const [, options] = mockedApiRequest.mock.calls[0];
    const body = (options as { body: object }).body;
    expect(Object.keys(body)).toEqual(["credential"]);
  });
});
