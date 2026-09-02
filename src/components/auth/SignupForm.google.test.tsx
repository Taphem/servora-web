import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { SignupForm } from "@/components/auth/SignupForm";
import { authenticateWithGoogle, getSession, register } from "@/lib/auth/api";
import { ApiError } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";

vi.mock("@/lib/env", () => ({
  env: { siteUrl: "https://test.example.com", apiBaseUrl: "https://api.test.example.com", googleClientId: "test-google-client-id" },
}));

vi.mock("@/lib/auth/googleIdentityServices", () => ({
  loadGoogleIdentityServices: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/api")>();
  return { ...actual, authenticateWithGoogle: vi.fn(), getSession: vi.fn(), register: vi.fn() };
});

const mockedAuthenticate = vi.mocked(authenticateWithGoogle);
const mockedGetSession = vi.mocked(getSession);
const mockedRegister = vi.mocked(register);

let capturedCallback: ((response: { credential: string }) => void) | null = null;
const initializeMock = vi.fn((config: { callback: (r: { credential: string }) => void }) => {
  capturedCallback = config.callback;
});

describe("SignupForm — Continue with Google", () => {
  beforeEach(() => {
    capturedCallback = null;
    initializeMock.mockClear();
    mockedAuthenticate.mockReset();
    mockedGetSession.mockReset();
    mockedRegister.mockReset();
    mockedGetSession.mockResolvedValue({ authenticated: false });

    Object.defineProperty(window, "google", {
      configurable: true,
      writable: true,
      value: { accounts: { id: { initialize: initializeMock, renderButton: vi.fn(), prompt: vi.fn(), cancel: vi.fn(), disableAutoSelect: vi.fn() } } },
    });
  });

  afterEach(() => {
    delete window.google;
  });

  it("renders the Google button alongside the signup fields", async () => {
    renderWithProviders(<SignupForm onSwitchToLogin={vi.fn()} onDone={vi.fn()} />);
    await waitFor(() => expect(initializeMock).toHaveBeenCalled());
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });

  it("existing Google account clicked from Signup: authenticates (logs in) — never shows a duplicate-account error", async () => {
    mockedAuthenticate.mockResolvedValue({
      userId: "u1",
      email: "already-a-servora-user@example.com",
      role: "CUSTOMER",
      emailVerified: true,
      phoneVerified: false,
    });
    const onDone = vi.fn();
    renderWithProviders(<SignupForm onSwitchToLogin={vi.fn()} onDone={onDone} />);
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "google-token-for-existing-account" });

    // Closes the modal directly — no "check your email" screen, and
    // critically, no EMAIL_ALREADY_REGISTERED-style error anywhere.
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
    // The frontend never calls the email/password register() endpoint
    // for this flow — servora-auth alone decides new-vs-existing.
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("new Google identity clicked from Signup: the request still succeeds and closes the modal, without a phone prompt or email-verification step", async () => {
    mockedAuthenticate.mockResolvedValue({
      userId: "u2",
      email: "brand-new-google-user@example.com",
      role: "CUSTOMER",
      // A brand-new Google user is emailVerified: true immediately
      // (Google's own verified email is trusted server-side) and has no phone.
      emailVerified: true,
      phoneVerified: false,
    });
    const onDone = vi.fn();
    renderWithProviders(<SignupForm onSwitchToLogin={vi.fn()} onDone={onDone} />);
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "google-token-for-new-account" });

    await waitFor(() => expect(mockedAuthenticate).toHaveBeenCalledWith("google-token-for-new-account"));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(screen.queryByText(/verify your phone number/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
  });

  it("shows the friendly Google error message in the same banner used for signup errors", async () => {
    mockedAuthenticate.mockRejectedValue(new ApiError(AuthErrorCode.GoogleOAuthFailed, "backend detail", 401));
    renderWithProviders(<SignupForm onSwitchToLogin={vi.fn()} onDone={vi.fn()} />);
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "google-token" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/couldn't verify/i);
  });
});
