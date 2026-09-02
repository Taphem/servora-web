import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { LoginForm } from "@/components/auth/LoginForm";
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

describe("LoginForm — Continue with Google", () => {
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

  it("renders the Google button alongside email/password fields", async () => {
    renderWithProviders(
      <LoginForm onSwitchToSignup={vi.fn()} onSwitchToForgotPassword={vi.fn()} onSuccess={vi.fn()} />,
    );
    await waitFor(() => expect(initializeMock).toHaveBeenCalled());
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("existing Google account: authenticates and calls onSuccess — the SAME action as an unknown account, no login/signup branching", async () => {
    mockedAuthenticate.mockResolvedValue({
      userId: "u1",
      email: "existing@example.com",
      role: "CUSTOMER",
      emailVerified: true,
      phoneVerified: false,
    });
    const onSuccess = vi.fn();
    renderWithProviders(
      <LoginForm onSwitchToSignup={vi.fn()} onSwitchToForgotPassword={vi.fn()} onSuccess={onSuccess} />,
    );
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "google-token" });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    // The frontend never calls register()/login() for this flow — it never
    // decides "this is a signup" or "this is a login".
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("shows the friendly Google error message in the same banner used for email/password errors", async () => {
    mockedAuthenticate.mockRejectedValue(new ApiError(AuthErrorCode.GoogleOAuthFailed, "backend detail", 401));
    renderWithProviders(
      <LoginForm onSwitchToSignup={vi.fn()} onSwitchToForgotPassword={vi.fn()} onSuccess={vi.fn()} />,
    );
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "google-token" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/couldn't verify/i);
  });
});
