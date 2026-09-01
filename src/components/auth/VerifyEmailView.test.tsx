import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { VerifyEmailView } from "@/components/auth/VerifyEmailView";
import { verifyEmail, resendVerificationEmail } from "@/lib/auth/api";
import { ApiError } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";

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
  return { ...actual, verifyEmail: vi.fn(), resendVerificationEmail: vi.fn() };
});

const mockedVerifyEmail = vi.mocked(verifyEmail);
const mockedResend = vi.mocked(resendVerificationEmail);

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

  it("shows a success state and offers to continue to login", async () => {
    setUrl("token=abc123");
    mockedVerifyEmail.mockResolvedValue({ verified: true });

    renderWithProviders(<VerifyEmailView />);

    expect(await screen.findByText(/email verified/i)).toBeInTheDocument();
    screen.getByRole("button", { name: /continue to login/i }).click();
    expect(openLogin).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/");
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
