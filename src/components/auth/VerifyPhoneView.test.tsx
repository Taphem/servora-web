import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { VerifyPhoneView } from "@/components/auth/VerifyPhoneView";
import { requestPhoneOtp, verifyPhoneOtp, getSession } from "@/lib/auth/api";
import { ApiError } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";

const openLogin = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/components/auth/AuthModalProvider", () => ({
  useAuthModal: () => ({ openLogin, openSignup: vi.fn(), close: vi.fn() }),
}));

vi.mock("@/lib/auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/api")>();
  return { ...actual, requestPhoneOtp: vi.fn(), verifyPhoneOtp: vi.fn(), getSession: vi.fn() };
});

const mockedRequestOtp = vi.mocked(requestPhoneOtp);
const mockedVerifyOtp = vi.mocked(verifyPhoneOtp);
const mockedGetSession = vi.mocked(getSession);

const authenticatedSession = (phoneVerified: boolean) => ({
  authenticated: true as const,
  userId: "u1",
  email: "user@example.com",
  role: "CUSTOMER" as const,
  emailVerified: true,
  phoneVerified,
});

async function renderAuthenticated(phoneVerified: boolean) {
  mockedGetSession.mockResolvedValue(authenticatedSession(phoneVerified));
  renderWithProviders(<VerifyPhoneView />);
  await waitFor(() => expect(mockedGetSession).toHaveBeenCalled());
}

describe("VerifyPhoneView", () => {
  beforeEach(() => {
    openLogin.mockClear();
    push.mockClear();
    mockedRequestOtp.mockReset();
    mockedVerifyOtp.mockReset();
    mockedGetSession.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("prompts an unauthenticated visitor to log in, and never calls the OTP API", async () => {
    mockedGetSession.mockResolvedValue({ authenticated: false });
    renderWithProviders(<VerifyPhoneView />);

    expect(await screen.findByText(/log in to verify your phone/i)).toBeInTheDocument();
    expect(mockedRequestOtp).not.toHaveBeenCalled();

    screen.getByRole("button", { name: /^log in$/i }).click();
    expect(openLogin).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/");
  });

  it("shows the already-verified state immediately for a user whose phone is already verified, without requesting an OTP", async () => {
    await renderAuthenticated(true);

    expect(await screen.findByText(/phone number verified/i)).toBeInTheDocument();
    expect(mockedRequestOtp).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /send verification code/i })).not.toBeInTheDocument();
  });

  it("an authenticated user with no verified phone sees the 'send code' action", async () => {
    await renderAuthenticated(false);

    expect(await screen.findByRole("button", { name: /send verification code/i })).toBeInTheDocument();
  });

  it("sends the OTP request with exactly {} — never a phone number", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    await renderAuthenticated(false);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));

    await waitFor(() => expect(mockedRequestOtp).toHaveBeenCalledTimes(1));
    expect(mockedRequestOtp).toHaveBeenCalledWith();
  });

  it("shows a 'no phone on file' state (not an error) for PHONE_NOT_SET", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockRejectedValue(new ApiError(AuthErrorCode.PhoneNotSet, "no phone", 400));
    await renderAuthenticated(false);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));

    expect(await screen.findByText(/no phone number on file/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("submits only the OTP the user typed — no email/password fields, nothing else", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    mockedVerifyOtp.mockResolvedValue({ verified: true });
    mockedGetSession.mockResolvedValueOnce(authenticatedSession(false)).mockResolvedValue(authenticatedSession(true));
    renderWithProviders(<VerifyPhoneView />);

    await user.click(await screen.findByRole("button", { name: /send verification code/i }));
    await user.type(await screen.findByLabelText(/verification code/i), "482913");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    await waitFor(() => expect(mockedVerifyOtp).toHaveBeenCalledWith("482913"));
    expect(mockedVerifyOtp.mock.calls[0]).toHaveLength(1);
  });

  it("on success, refreshes the session through the existing auth mechanism and shows verified", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    mockedVerifyOtp.mockResolvedValue({ verified: true });
    mockedGetSession.mockResolvedValueOnce(authenticatedSession(false)).mockResolvedValue(authenticatedSession(true));
    renderWithProviders(<VerifyPhoneView />);

    await user.click(await screen.findByRole("button", { name: /send verification code/i }));
    await user.type(await screen.findByLabelText(/verification code/i), "482913");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(await screen.findByText(/you're all set/i)).toBeInTheDocument();
    // Once for AuthProvider's own mount check, again via refresh() after verifying.
    await waitFor(() => expect(mockedGetSession).toHaveBeenCalledTimes(2));
  });

  it("shows a clean message for an invalid OTP", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    mockedVerifyOtp.mockRejectedValue(new ApiError(AuthErrorCode.OtpInvalid, "wrong", 400));
    await renderAuthenticated(false);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));
    await user.type(await screen.findByLabelText(/verification code/i), "000000");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/isn't right/i);
    // Wrong-but-retryable: still on the OTP form, not bounced back to idle.
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
  });

  it("sends the user back to request a new code for an expired/already-used OTP (OTP_NOT_REQUESTED)", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    mockedVerifyOtp.mockRejectedValue(new ApiError(AuthErrorCode.OtpNotRequested, "gone", 400));
    await renderAuthenticated(false);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));
    await user.type(await screen.findByLabelText(/verification code/i), "482913");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(await screen.findByText(/expired or was already used/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /send verification code/i })).toBeInTheDocument();
  });

  it("sends the user back to request a new code after too many failed attempts", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    mockedVerifyOtp.mockRejectedValue(new ApiError(AuthErrorCode.OtpAttemptsExceeded, "too many", 429));
    await renderAuthenticated(false);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));
    await user.type(await screen.findByLabelText(/verification code/i), "482913");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(await screen.findByText(/too many incorrect attempts/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /send verification code/i })).toBeInTheDocument();
  });

  it("shows a rate-limit message when the backend cooldown rejects a request, without bypassing it", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockRejectedValue(new ApiError(AuthErrorCode.RateLimited, "slow down", 429));
    await renderAuthenticated(false);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/too many attempts/i);
  });

  it("treats a 401/session-expired response as a sign-out, prompting to log in again", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockRejectedValue(new ApiError(AuthErrorCode.Unauthenticated, "no session", 401));
    await renderAuthenticated(false);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));

    expect(await screen.findByText(/log in to verify your phone/i)).toBeInTheDocument();
  });

  it("shows a generic, safe message on network failure without exposing internals", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockRejectedValue(new Error("fetch failed"));
    await renderAuthenticated(false);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/something went wrong|couldn't reach/i);
    expect(alert).not.toHaveTextContent(/fetch failed/i);
  });

  it("never logs or persists the OTP the user typed", async () => {
    const user = userEvent.setup();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    mockedVerifyOtp.mockResolvedValue({ verified: true });
    mockedGetSession.mockResolvedValueOnce(authenticatedSession(false)).mockResolvedValue(authenticatedSession(true));
    renderWithProviders(<VerifyPhoneView />);

    await user.click(await screen.findByRole("button", { name: /send verification code/i }));
    await user.type(await screen.findByLabelText(/verification code/i), "918273");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));
    await screen.findByText(/you're all set/i);

    const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls].flat().join(" ");
    expect(logged).not.toContain("918273");
    const storage = JSON.stringify(localStorage).concat(JSON.stringify(sessionStorage));
    expect(storage).not.toContain("918273");
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("disables Resend for a debounce window right after sending, and re-enables it once that window passes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    mockedGetSession.mockResolvedValue(authenticatedSession(false));
    renderWithProviders(<VerifyPhoneView />);

    await user.click(await screen.findByRole("button", { name: /send verification code/i }));
    const resendButton = await screen.findByRole("button", { name: /resend code/i });
    expect(resendButton).toBeDisabled();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(screen.getByRole("button", { name: /^resend code$/i })).not.toBeDisabled();
  });

  it("prevents a duplicate OTP-request when 'Send code' is triggered rapidly before the first resolves", async () => {
    let resolveRequest!: (v: { requested: true; expiresInSeconds: number }) => void;
    mockedRequestOtp.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    await renderAuthenticated(false);

    const button = screen.getByRole("button", { name: /send verification code/i });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mockedRequestOtp).toHaveBeenCalledTimes(1);
    resolveRequest({ requested: true, expiresInSeconds: 300 });
    await screen.findByLabelText(/verification code/i);
  });

  it("prevents a duplicate verify submission before the first resolves", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    let resolveVerify!: (v: { verified: true }) => void;
    mockedVerifyOtp.mockReturnValue(
      new Promise((resolve) => {
        resolveVerify = resolve;
      }),
    );
    mockedGetSession.mockResolvedValue(authenticatedSession(false));
    renderWithProviders(<VerifyPhoneView />);

    await user.click(await screen.findByRole("button", { name: /send verification code/i }));
    await user.type(await screen.findByLabelText(/verification code/i), "482913");

    const form = screen.getByRole("button", { name: /^verify$/i }).closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(mockedVerifyOtp).toHaveBeenCalledTimes(1);
    resolveVerify({ verified: true });
    await screen.findByText(/you're all set/i);
  });
});
