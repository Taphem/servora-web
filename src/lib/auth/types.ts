import type { UserRole } from "@/types/domain";

/**
 * Types mirroring the real servora-auth contract, as verified from that
 * service's source (registerBodySchema, login.ts, session.ts, etc). Kept
 * separate from the mock marketplace types in src/types/domain.ts —
 * this is the one part of the app talking to an actual deployed backend.
 */

/** The shape returned by register (201) and login (200). */
export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
}

/** GET /api/v1/auth/session — always 200, this is the discriminant. */
export type SessionResponse =
  | { authenticated: false }
  | ({ authenticated: true } & AuthUser);

/**
 * `{ error: { code, message, requestId } }` — the envelope shared by
 * servora-auth and servora-api-gateway (confirmed identical shape,
 * different code enums per service). `code` is intentionally typed as
 * `string` rather than a closed union: the frontend must degrade
 * gracefully to a generic message for any code it doesn't recognize
 * rather than fail to compile against ones added to the backend later.
 */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

/** Known error codes this UI has specific copy/behavior for. Anything else falls back to a generic message. */
export const AuthErrorCode = {
  ValidationFailed: "VALIDATION_FAILED",
  EmailAlreadyRegistered: "EMAIL_ALREADY_REGISTERED",
  InvalidCredentials: "INVALID_CREDENTIALS",
  AccountLocked: "ACCOUNT_LOCKED",
  AccountDisabled: "ACCOUNT_DISABLED",
  TokenInvalid: "TOKEN_INVALID",
  RateLimited: "RATE_LIMITED",
  DownstreamUnavailable: "DOWNSTREAM_UNAVAILABLE",
  DownstreamTimeout: "DOWNSTREAM_TIMEOUT",
  DownstreamNotConfigured: "DOWNSTREAM_NOT_CONFIGURED",
  /** POST /phone/otp/request: this account has no phone on file — never surfaced as a scary error, see VerifyPhoneView. */
  PhoneNotSet: "PHONE_NOT_SET",
  PhoneAlreadyVerified: "PHONE_ALREADY_VERIFIED",
  /** POST /phone/otp/verify: no active challenge — covers both "expired" and "already used", the backend doesn't distinguish (Redis TTL removes the challenge either way). */
  OtpNotRequested: "OTP_NOT_REQUESTED",
  OtpAttemptsExceeded: "OTP_ATTEMPTS_EXCEEDED",
  OtpInvalid: "OTP_INVALID",
  /** POST /auth/google: collapses every Google ID-token verification failure (expired, bad signature, wrong audience, malformed) into one code — the backend deliberately doesn't distinguish them. */
  GoogleOAuthFailed: "GOOGLE_OAUTH_FAILED",
  /** POST /auth/google: servora-auth has no GOOGLE_CLIENT_ID configured server-side — an environment/ops issue, not a user error. */
  GoogleOAuthNotConfigured: "GOOGLE_OAUTH_NOT_CONFIGURED",
  /** Both phone OTP endpoints require an existing session (requireSession()) — thrown when there's no/an invalid session cookie, e.g. it expired mid-flow. */
  Unauthenticated: "UNAUTHENTICATED",
} as const;
