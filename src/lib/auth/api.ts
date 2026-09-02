import { apiRequest } from "@/lib/auth/client";
import type { AuthUser, SessionResponse } from "@/lib/auth/types";

/**
 * Typed wrappers for the real servora-auth endpoints, reached through
 * the API Gateway at `/api/v1/auth/*`. Contracts verified by reading
 * servora-auth's actual route/schema source (not guessed, not from
 * servora-docs, which is aspirational for this area) — see the
 * "Authentication" section of README.md for the full contract notes,
 * including a couple of backend behaviors worth knowing before touching
 * this file:
 *
 *  - Registration logs the user in immediately (sets the session
 *    cookie) even though `emailVerified` is false. It is NOT a
 *    "pending" account — it's a real session for an unverified email.
 *  - Login does not reject unverified accounts; `emailVerified` in the
 *    response is the only signal, and the UI decides what to do with it.
 *  - /email/verify and /password/reset/confirm both collapse "invalid",
 *    "expired", and "already used" token states into one generic
 *    `TOKEN_INVALID` — the backend does not distinguish them, so this
 *    UI doesn't either.
 *  - `phone` on register is optional and never echoed back by any
 *    response (register/login/session all omit it — only the boolean
 *    `phoneVerified` is exposed). There is no way to ask "does this
 *    account have a phone on file" from session state alone; the only
 *    reliable signal is the immediate register() call in the same
 *    browser session, or a PHONE_NOT_SET response from the OTP-request
 *    endpoint itself. See PhoneVerificationCard.
 */

export function register(email: string, password: string, phone?: string): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/v1/auth/register", {
    method: "POST",
    // Omit the property entirely when there's no phone — never send `phone: ""`.
    body: phone ? { email, password, phone } : { email, password },
  });
}

export function login(email: string, password: string): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/v1/auth/login", { method: "POST", body: { email, password } });
}

export function logout(): Promise<void> {
  return apiRequest<void>("/api/v1/auth/logout", { method: "POST" });
}

export function getSession(): Promise<SessionResponse> {
  return apiRequest<SessionResponse>("/api/v1/auth/session");
}

/** Body-only — the token travels in the JSON body, never as a query/path param at the API level. */
export function verifyEmail(token: string): Promise<{ verified: true }> {
  return apiRequest<{ verified: true }>("/api/v1/auth/email/verify", { method: "POST", body: { token } });
}

/**
 * Always resolves with the same generic message regardless of whether
 * the email exists, is already verified, or was actually resent — the
 * backend is deliberately enumeration-safe here. Don't build UI that
 * implies certainty about what happened.
 */
export function resendVerificationEmail(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/v1/auth/email/resend", { method: "POST", body: { email } });
}

/** Same enumeration-safe pattern as resend — always the same generic message. */
export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/v1/auth/password/reset/request", {
    method: "POST",
    body: { email },
  });
}

/** Revokes ALL of the user's sessions on success — the caller must not assume they're still logged in afterward. */
export function confirmPasswordReset(token: string, newPassword: string): Promise<{ reset: true }> {
  return apiRequest<{ reset: true }>("/api/v1/auth/password/reset/confirm", {
    method: "POST",
    body: { token, newPassword },
  });
}

/**
 * Requires an existing session — this is not a public/token-based flow
 * like email verification. The body is deliberately an empty object: the
 * backend derives the phone number from the authenticated user's stored
 * account and rejects a `phone` key in the body with VALIDATION_FAILED.
 * Never send a phone number here.
 */
export function requestPhoneOtp(): Promise<{ requested: true; expiresInSeconds: number }> {
  return apiRequest<{ requested: true; expiresInSeconds: number }>("/api/v1/auth/phone/otp/request", {
    method: "POST",
    body: {},
  });
}

/**
 * Also requires an existing session. Unlike email verification, a
 * successful call here does NOT log anyone in or return session/user
 * fields — it only flips phoneVerifiedAt server-side. Callers must
 * re-check the session (getSession/refresh) afterward to see
 * phoneVerified: true reflected in the UI.
 */
export function verifyPhoneOtp(otp: string): Promise<{ verified: true }> {
  return apiRequest<{ verified: true }>("/api/v1/auth/phone/otp/verify", { method: "POST", body: { otp } });
}
