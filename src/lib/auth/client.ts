import { env } from "@/lib/env";
import type { ApiErrorBody } from "@/lib/auth/types";

/**
 * The one place a request leaves this app for the real backend. The
 * browser calls the API Gateway only — never servora-auth or any other
 * downstream service directly (see servora-docs/02-architecture).
 *
 * Session auth is an httpOnly cookie set by servora-auth and forwarded
 * verbatim by the gateway — there is no token for the frontend to read,
 * store, or attach to headers. `credentials: "include"` is required on
 * every call so the browser sends/accepts that cookie cross-origin.
 */

/** Frontend-only synthetic codes for failures that never reach the backend's own error envelope — kept clearly distinct from real backend `ApiErrorCode`s (see types.ts) so the two are never confused. */
export const ClientErrorCode = {
  /** fetch() itself threw — offline, DNS failure, CORS rejection, etc. */
  NetworkError: "CLIENT_NETWORK_ERROR",
  /** Response wasn't the `{ error: { code, message } }` envelope we expect. */
  MalformedResponse: "CLIENT_MALFORMED_RESPONSE",
} as const;

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;

  constructor(code: string, message: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  /** Caller-provided body. Never logged by this client — callers must not log it either (see auth/api.ts). */
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // Deliberately no `console.error(error)` here — a network-layer
    // failure can echo back parts of the request (URL, sometimes body)
    // depending on the environment, and this path is also reachable
    // from the verification/reset flows that carry a token.
    throw new ApiError(ClientErrorCode.NetworkError, "Couldn't reach the server. Check your connection and try again.", 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (isApiErrorBody(payload)) {
      throw new ApiError(payload.error.code, payload.error.message, response.status, payload.error.requestId);
    }
    throw new ApiError(
      ClientErrorCode.MalformedResponse,
      "Something went wrong on our end. Please try again.",
      response.status,
    );
  }

  return payload as T;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const err = (value as { error?: unknown }).error;
  return (
    typeof err === "object" &&
    err !== null &&
    typeof (err as { code?: unknown }).code === "string" &&
    typeof (err as { message?: unknown }).message === "string"
  );
}
