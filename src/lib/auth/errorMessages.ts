import { ApiError, ClientErrorCode } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";

/**
 * Turns a thrown error from src/lib/auth/api.ts into copy a person can
 * read — never the raw backend message verbatim for codes we have a
 * clearer explanation for, never a stack trace, never a token (errors
 * from this layer never carry one — see client.ts).
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }

  switch (error.code) {
    case AuthErrorCode.ValidationFailed:
      return "Please check the highlighted fields and try again.";
    case AuthErrorCode.EmailAlreadyRegistered:
      return "An account with this email already exists.";
    case AuthErrorCode.InvalidCredentials:
      return "That email and password don't match.";
    case AuthErrorCode.AccountLocked:
      return "This account is temporarily locked. Please try again later.";
    case AuthErrorCode.AccountDisabled:
      return "This account has been disabled.";
    case AuthErrorCode.TokenInvalid:
      return "This link is invalid or has expired.";
    case AuthErrorCode.RateLimited:
      return "Too many attempts. Please wait a moment and try again.";
    case AuthErrorCode.PhoneAlreadyVerified:
      return "Your phone number is already verified.";
    case AuthErrorCode.OtpNotRequested:
      return "That code has expired or was already used. Send a new one.";
    case AuthErrorCode.OtpAttemptsExceeded:
      return "Too many incorrect attempts. Send a new code and try again.";
    case AuthErrorCode.OtpInvalid:
      return "That code isn't right. Check it and try again.";
    case AuthErrorCode.GoogleOAuthFailed:
      return "We couldn't verify that Google account. Please try again.";
    case AuthErrorCode.GoogleOAuthNotConfigured:
      return "Google sign-in isn't available right now. Please use email and password.";
    case AuthErrorCode.Unauthenticated:
      return "Your session has expired. Please log in again.";
    case AuthErrorCode.DownstreamUnavailable:
    case AuthErrorCode.DownstreamTimeout:
    case AuthErrorCode.DownstreamNotConfigured:
      return "Servora's servers are temporarily unavailable. Please try again shortly.";
    case ClientErrorCode.NetworkError:
    case ClientErrorCode.MalformedResponse:
      return error.message;
    default:
      // An unrecognized backend code — still safe to show, it's the
      // backend's own human-readable message, just not one this UI has
      // bespoke copy for.
      return error.message || "Something went wrong. Please try again.";
  }
}
