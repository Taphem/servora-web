import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { SignupForm } from "@/components/auth/SignupForm";
import { register, getSession, resendVerificationEmail } from "@/lib/auth/api";
import { ApiError } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";

vi.mock("@/lib/auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/api")>();
  return { ...actual, register: vi.fn(), getSession: vi.fn(), resendVerificationEmail: vi.fn() };
});

const mockedRegister = vi.mocked(register);
const mockedGetSession = vi.mocked(getSession);
const mockedResend = vi.mocked(resendVerificationEmail);

function setup() {
  const onSwitchToLogin = vi.fn();
  const onDone = vi.fn();
  renderWithProviders(<SignupForm onSwitchToLogin={onSwitchToLogin} onDone={onDone} />);
  return { onSwitchToLogin, onDone };
}

describe("SignupForm", () => {
  beforeEach(() => {
    mockedRegister.mockReset();
    mockedGetSession.mockReset();
    mockedResend.mockReset();
    mockedGetSession.mockResolvedValue({ authenticated: false });
  });

  it("rejects a password shorter than the real backend's 10-character minimum", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("rejects a mismatched confirm-password, client-side, without calling the API", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/confirm password/i), "doesnotmatch");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("calls register() with only email + password (confirmPassword is never sent)", async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: false,
      phoneVerified: false,
    });
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpassword");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(mockedRegister).toHaveBeenCalledWith("user@example.com", "longenoughpassword"));
    expect(mockedRegister.mock.calls[0]).toHaveLength(2);
  });

  it("rejects a phone number that isn't valid E.164 format, client-side, without calling the API", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/phone number/i), "0123-not-a-phone");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/international format/i)).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("includes a valid phone number in the registration request", async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: false,
      phoneVerified: false,
    });
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/phone number/i), "+14155552671");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(mockedRegister).toHaveBeenCalledWith("user@example.com", "longenoughpassword", "+14155552671"),
    );
  });

  it("shows the phone verification card after signup only when a phone number was actually given", async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: false,
      phoneVerified: false,
    });
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/phone number/i), "+14155552671");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await screen.findByText(/check your email/i);
    expect(screen.getByText(/verify your phone number/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send verification code/i })).toBeInTheDocument();
  });

  it("does not show any phone verification UI when the phone field was left blank", async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: false,
      phoneVerified: false,
    });
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpassword");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await screen.findByText(/check your email/i);
    expect(screen.queryByText(/verify your phone number/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send verification code/i })).not.toBeInTheDocument();
  });

  it("shows the duplicate-email message on 409 EMAIL_ALREADY_REGISTERED", async () => {
    const user = userEvent.setup();
    mockedRegister.mockRejectedValue(new ApiError(AuthErrorCode.EmailAlreadyRegistered, "backend message", 409));
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpassword");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/already exists/i);
  });

  it("on success, shows a 'check your email' state rather than pretending the account is fully verified", async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: false,
      phoneVerified: false,
    });
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpassword");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
  });

  it("sends exactly one /register request even when the form is submitted twice before the first response lands", async () => {
    // Simulates a double-click or a repeated Enter key: two submit events
    // fire before React has a chance to re-render the button as disabled.
    let resolveRegister!: (user: Awaited<ReturnType<typeof register>>) => void;
    mockedRegister.mockReturnValue(
      new Promise((resolve) => {
        resolveRegister = resolve;
      }),
    );
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpassword");

    const form = screen.getByRole("button", { name: /create account/i }).closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(mockedRegister).toHaveBeenCalledTimes(1);

    resolveRegister({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: false,
      phoneVerified: false,
    });
    await screen.findByText(/check your email/i);
    expect(mockedRegister).toHaveBeenCalledTimes(1);
  });

  it("re-enables submission after a failed attempt, without ever sending a second concurrent request", async () => {
    const user = userEvent.setup();
    mockedRegister.mockRejectedValueOnce(new ApiError(AuthErrorCode.EmailAlreadyRegistered, "backend message", 409));
    mockedRegister.mockResolvedValueOnce({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: false,
      phoneVerified: false,
    });
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpassword");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    await screen.findByRole("alert");

    await user.click(screen.getByRole("button", { name: /create account/i }));
    await screen.findByText(/check your email/i);
    expect(mockedRegister).toHaveBeenCalledTimes(2);
  });

  it("lets the user resend the verification email from the success state", async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: false,
      phoneVerified: false,
    });
    mockedResend.mockResolvedValue({ message: "ok" });
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longenoughpassword");
    await user.type(screen.getByLabelText(/confirm password/i), "longenoughpassword");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    await screen.findByText(/check your email/i);

    await user.click(screen.getByRole("button", { name: /resend/i }));
    await waitFor(() => expect(mockedResend).toHaveBeenCalledWith("user@example.com"));
  });
});
