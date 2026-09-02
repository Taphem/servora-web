import { StrictMode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { VerifyEmailView } from "@/components/auth/VerifyEmailView";
import { verifyEmail, resendVerificationEmail, getSession } from "@/lib/auth/api";
import { ApiError } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/lib/auth/AuthProvider";

const openLogin = vi.fn();
const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/components/auth/AuthModalProvider", () => ({
  useAuthModal: () => ({ openLogin, openSignup: vi.fn(), close: vi.fn() }),
}));

vi.mock("@/lib/auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/api")>();
  return { ...actual, verifyEmail: vi.fn(), resendVerificationEmail: vi.fn(), getSession: vi.fn() };
});

const mockedVerifyEmail = vi.mocked(verifyEmail);
const mockedResend = vi.mocked(resendVerificationEmail);
const mockedGetSession = vi.mocked(getSession);

function setUrl(search: string) {
  searchParams = new URLSearchParams(search);
  window.history.pushState(null, "", `/verify-email${search ? `?${search}` : ""}`);
}

describe("VerifyEmailView", () => {
  beforeEach(() => {
    openLogin.mockClear();
    push.mockClear();
    mockedVerifyEmail.mockReset();
    mockedResend.mockReset();
    mockedGetSession.mockReset();
    mockedGetSession.mockResolvedValue({ authenticated: false });
  });

  it("shows a missing-link state and never calls the API when there is no token", async () => {
    setUrl("");
    renderWithProviders(<VerifyEmailView />);

    expect(await screen.findByText(/no verification link found/i)).toBeInTheDocument();
    expect(mockedVerifyEmail).not.toHaveBeenCalled();
  });

  it("strips the token from the visible URL immediately, before the request resolves", async () => {
    setUrl("token=super-secret-verification-token");
    let resolveVerify!: () => void;
    mockedVerifyEmail.mockReturnValue(new Promise((resolve) => (resolveVerify = () => resolve({ verified: true }))));

    renderWithProviders(<VerifyEmailView />);

    // The token is gone from the address bar right away — well before the
    // in-flight request has a chance to resolve.
    await waitFor(() => expect(window.location.search).toBe(""));
    expect(window.location.pathname).toBe("/verify-email");

    resolveVerify();
  });

  it("calls verifyEmail with the token from the URL, exactly once", async () => {
    setUrl("token=abc123");
    mockedVerifyEmail.mockResolvedValue({ verified: true });

    renderWithProviders(<VerifyEmailView />);

    await waitFor(() => expect(mockedVerifyEmail).toHaveBeenCalledTimes(1));
    expect(mockedVerifyEmail).toHaveBeenCalledWith("abc123");
  });

  it("when not logged in, shows success and offers a Log in action (not a fake authenticated state)", async () => {
    setUrl("token=abc123");
    mockedVerifyEmail.mockResolvedValue({ verified: true });
    mockedGetSession.mockResolvedValue({ authenticated: false });

    renderWithProviders(<VerifyEmailView />);

    expect(await screen.findByText(/email verified successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/log in to continue/i)).toBeInTheDocument();
    screen.getByRole("button", { name: /^log in$/i }).click();
    expect(openLogin).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/");
  });

  it("when already logged in, revalidates the session so emailVerified flips to true and offers to continue (not another login)", async () => {
    setUrl("token=abc123");
    mockedVerifyEmail.mockResolvedValue({ verified: true });
    mockedGetSession.mockResolvedValue({
      authenticated: true,
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: true,
      phoneVerified: false,
    });

    renderWithProviders(<VerifyEmailView />);

    expect(await screen.findByText(/email verified successfully/i)).toBeInTheDocument();
    // The session was re-checked (not just assumed) after a successful verify.
    await waitFor(() => expect(mockedGetSession).toHaveBeenCalled());
    expect(screen.getByText(/you're all set/i)).toBeInTheDocument();

    const continueButton = screen.getByRole("button", { name: /continue to servora/i });
    expect(screen.queryByRole("button", { name: /^log in$/i })).not.toBeInTheDocument();
    continueButton.click();
    expect(push).toHaveBeenCalledWith("/");
    expect(openLogin).not.toHaveBeenCalled();
  });

  it("calls verifyEmail exactly once under React StrictMode's double-invoke behavior", async () => {
    setUrl("token=abc123");
    mockedVerifyEmail.mockResolvedValue({ verified: true });

    render(
      <StrictMode>
        <ToastProvider>
          <AuthProvider>
            <VerifyEmailView />
          </AuthProvider>
        </ToastProvider>
      </StrictMode>,
    );

    await screen.findByText(/email verified successfully/i);
    expect(mockedVerifyEmail).toHaveBeenCalledTimes(1);
  });

  it("shows one generic invalid-or-expired state for TOKEN_INVALID (no separate expired/used states)", async () => {
    setUrl("token=stale-token");
    mockedVerifyEmail.mockRejectedValue(new ApiError(AuthErrorCode.TokenInvalid, "invalid", 400));

    renderWithProviders(<VerifyEmailView />);

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
  });

  it("shows a distinct, retryable network-error state for non-token failures", async () => {
    setUrl("token=abc123");
    mockedVerifyEmail.mockRejectedValue(new Error("boom"));

    renderWithProviders(<VerifyEmailView />);

    expect(await screen.findByText(/couldn't verify right now/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("offers a resend form on the invalid-token state, calling the real resend endpoint", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    setUrl("token=stale-token");
    mockedVerifyEmail.mockRejectedValue(new ApiError(AuthErrorCode.TokenInvalid, "invalid", 400));
    mockedResend.mockResolvedValue({ message: "ok" });

    renderWithProviders(<VerifyEmailView />);
    await screen.findByText(/invalid or has expired/i);

    await user.type(screen.getByLabelText(/email address/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /resend verification email/i }));

    await waitFor(() => expect(mockedResend).toHaveBeenCalledWith("user@example.com"));
  });

  it("never logs the raw token to the console", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setUrl("token=super-secret-verification-token");
    mockedVerifyEmail.mockResolvedValue({ verified: true });

    renderWithProviders(<VerifyEmailView />);
    await screen.findByText(/email verified/i);

    const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls].flat().join(" ");
    expect(logged).not.toContain("super-secret-verification-token");
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("never persists the token to localStorage or sessionStorage", async () => {
    setUrl("token=super-secret-verification-token");
    mockedVerifyEmail.mockResolvedValue({ verified: true });

    renderWithProviders(<VerifyEmailView />);
    await screen.findByText(/email verified/i);

    const allLocalStorage = JSON.stringify(localStorage).concat(JSON.stringify(sessionStorage));
    expect(allLocalStorage).not.toContain("super-secret-verification-token");
  });

  it("does not re-attempt verification with a missing token after the URL has been cleaned (no refresh loop)", async () => {
    setUrl("token=abc123");
    mockedVerifyEmail.mockResolvedValue({ verified: true });

    const { unmount } = renderWithProviders(<VerifyEmailView />);
    await screen.findByText(/email verified/i);
    unmount();

    // Simulate a refresh: URL now has no token (as it would after cleanup),
    // and a fresh mount reads that clean URL directly.
    setUrl("");
    mockedVerifyEmail.mockClear();
    renderWithProviders(<VerifyEmailView />);

    expect(await screen.findByText(/no verification link found/i)).toBeInTheDocument();
    expect(mockedVerifyEmail).not.toHaveBeenCalled();
  });
});
