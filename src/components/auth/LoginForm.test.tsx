import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { LoginForm } from "@/components/auth/LoginForm";
import { login, getSession } from "@/lib/auth/api";
import { ApiError } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";

vi.mock("@/lib/auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/api")>();
  return { ...actual, login: vi.fn(), getSession: vi.fn() };
});

const mockedLogin = vi.mocked(login);
const mockedGetSession = vi.mocked(getSession);

function setup() {
  const onSwitchToSignup = vi.fn();
  const onSwitchToForgotPassword = vi.fn();
  const onSuccess = vi.fn();
  renderWithProviders(
    <LoginForm
      onSwitchToSignup={onSwitchToSignup}
      onSwitchToForgotPassword={onSwitchToForgotPassword}
      onSuccess={onSuccess}
    />,
  );
  return { onSwitchToSignup, onSwitchToForgotPassword, onSuccess };
}

describe("LoginForm", () => {
  beforeEach(() => {
    mockedLogin.mockReset();
    mockedGetSession.mockReset();
    mockedGetSession.mockResolvedValue({ authenticated: false });
  });

  it("shows validation errors and never calls the API for an empty submit", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText(/enter your email address/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it("calls POST /api/v1/auth/login (via login()) with the entered credentials", async () => {
    const user = userEvent.setup();
    mockedLogin.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: true,
      phoneVerified: false,
    });
    const { onSuccess } = setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "whatever-they-typed");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(mockedLogin).toHaveBeenCalledWith("user@example.com", "whatever-they-typed"));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("shows the real 401 error message on invalid credentials, not a raw error dump", async () => {
    const user = userEvent.setup();
    mockedLogin.mockRejectedValue(new ApiError(AuthErrorCode.InvalidCredentials, "backend message", 401));
    setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrong");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/don't match/i);
  });

  it("still logs in an unverified account — the backend does not block it", async () => {
    const user = userEvent.setup();
    mockedLogin.mockResolvedValue({
      userId: "u1",
      email: "unverified@example.com",
      role: "CUSTOMER",
      emailVerified: false,
      phoneVerified: false,
    });
    const { onSuccess } = setup();

    await user.type(screen.getByLabelText(/email/i), "unverified@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "whatever");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("switches to signup and forgot-password via the provided callbacks", async () => {
    const user = userEvent.setup();
    const { onSwitchToSignup, onSwitchToForgotPassword } = setup();

    await user.click(screen.getByRole("button", { name: /sign up/i }));
    expect(onSwitchToSignup).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /forgot password/i }));
    expect(onSwitchToForgotPassword).toHaveBeenCalled();
  });
});
