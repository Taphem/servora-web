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
 */

export function register(email: string, password: string): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/v1/auth/register", { method: "POST", body: { email, password } });
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
