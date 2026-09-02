import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { PhoneVerificationCard } from "@/components/auth/PhoneVerificationCard";
import { requestPhoneOtp, verifyPhoneOtp, getSession } from "@/lib/auth/api";
import { ApiError } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";

vi.mock("@/lib/auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/api")>();
  return { ...actual, requestPhoneOtp: vi.fn(), verifyPhoneOtp: vi.fn(), getSession: vi.fn() };
});

const mockedRequestOtp = vi.mocked(requestPhoneOtp);
const mockedVerifyOtp = vi.mocked(verifyPhoneOtp);
const mockedGetSession = vi.mocked(getSession);

describe("PhoneVerificationCard", () => {
  beforeEach(() => {
    mockedRequestOtp.mockReset();
    mockedVerifyOtp.mockReset();
    mockedGetSession.mockReset();
    mockedGetSession.mockResolvedValue({ authenticated: false });
  });

  it("sends an OTP request with exactly {} — never a phone number", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    renderWithProviders(<PhoneVerificationCard phone="+14155552671" />);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));

    await waitFor(() => expect(mockedRequestOtp).toHaveBeenCalledTimes(1));
    expect(mockedRequestOtp).toHaveBeenCalledWith();
  });

  it("shows the OTP input with expiry info after a successful request", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 600 });
    renderWithProviders(<PhoneVerificationCard phone="+14155552671" />);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));

    expect(await screen.findByLabelText(/verification code/i)).toBeInTheDocument();
    expect(screen.getByText(/expires in about 10 minute/i)).toBeInTheDocument();
  });

  it("hides itself entirely on PHONE_NOT_SET, without showing an error", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockRejectedValue(new ApiError(AuthErrorCode.PhoneNotSet, "No phone on file", 400));
    renderWithProviders(<PhoneVerificationCard />);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));

    await waitFor(() => expect(screen.queryByText(/verify your phone number/i)).not.toBeInTheDocument());
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("submits only the OTP the user typed, nothing else", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    mockedVerifyOtp.mockResolvedValue({ verified: true });
    mockedGetSession.mockResolvedValue({
      authenticated: true,
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: false,
      phoneVerified: true,
    });
    renderWithProviders(<PhoneVerificationCard phone="+14155552671" />);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));
    await screen.findByLabelText(/verification code/i);
    await user.type(screen.getByLabelText(/verification code/i), "482913");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    await waitFor(() => expect(mockedVerifyOtp).toHaveBeenCalledWith("482913"));
  });

  it("re-checks the session after a successful verification (no reload) and shows verified", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    mockedVerifyOtp.mockResolvedValue({ verified: true });
    mockedGetSession.mockResolvedValue({
      authenticated: true,
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: false,
      phoneVerified: true,
    });
    renderWithProviders(<PhoneVerificationCard phone="+14155552671" />);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));
    await user.type(await screen.findByLabelText(/verification code/i), "482913");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(await screen.findByText(/phone number verified/i)).toBeInTheDocument();
    // getSession is called once by AuthProvider's own mount effect and again by refresh() here.
    await waitFor(() => expect(mockedGetSession).toHaveBeenCalledTimes(2));
  });

  it("shows a clean message for an invalid code, without crashing", async () => {
    const user = userEvent.setup();
    mockedRequestOtp.mockResolvedValue({ requested: true, expiresInSeconds: 300 });
    mockedVerifyOtp.mockRejectedValue(new ApiError(AuthErrorCode.OtpInvalid, "wrong code", 400));
    renderWithProviders(<PhoneVerificationCard phone="+14155552671" />);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));
    await user.type(await screen.findByLabelText(/verification code/i), "000000");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/isn't right/i);
  });

  it("prevents a duplicate OTP-request when 'Send code' is triggered twice before the first resolves", async () => {
    let resolveRequest!: (v: { requested: true; expiresInSeconds: number }) => void;
    mockedRequestOtp.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    renderWithProviders(<PhoneVerificationCard phone="+14155552671" />);

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
    mockedGetSession.mockResolvedValue({ authenticated: false });
    renderWithProviders(<PhoneVerificationCard phone="+14155552671" />);

    await user.click(screen.getByRole("button", { name: /send verification code/i }));
    const otpField = await screen.findByLabelText(/verification code/i);
    await user.type(otpField, "482913");

    const form = screen.getByRole("button", { name: /^verify$/i }).closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(mockedVerifyOtp).toHaveBeenCalledTimes(1);
    resolveVerify({ verified: true });
    await screen.findByText(/phone number verified/i);
  });
});
