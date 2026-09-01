import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";
import { confirmPasswordReset } from "@/lib/auth/api";
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
  return { ...actual, confirmPasswordReset: vi.fn() };
});

const mockedConfirm = vi.mocked(confirmPasswordReset);

function setUrl(search: string) {
  searchParams = new URLSearchParams(search);
  window.history.pushState(null, "", `/reset-password${search ? `?${search}` : ""}`);
}

describe("ResetPasswordView", () => {
  beforeEach(() => {
    openLogin.mockClear();
    push.mockClear();
    mockedConfirm.mockReset();
  });

  it("shows a missing-link state with no token, and renders no password form", async () => {
    setUrl("");
    renderWithProviders(<ResetPasswordView />);

    expect(await screen.findByText(/no reset link found/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  it("strips the token from the visible URL immediately on mount", async () => {
    setUrl("token=super-secret-reset-token");
    renderWithProviders(<ResetPasswordView />);

    await waitFor(() => expect(window.location.search).toBe(""));
    expect(window.location.pathname).toBe("/reset-password");
  });

  it("validates the new password length and match before calling the API", async () => {
    const user = userEvent.setup();
    setUrl("token=abc123");
    renderWithProviders(<ResetPasswordView />);
    await screen.findByLabelText(/^new password$/i);

    await user.type(screen.getByLabelText(/^new password$/i), "short1");
    await user.click(screen.getByRole("button", { name: /reset password/i }));
    expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(mockedConfirm).not.toHaveBeenCalled();
  });

  it("calls confirmPasswordReset with the in-memory token and new password", async () => {
    const user = userEvent.setup();
    setUrl("token=abc123");
    mockedConfirm.mockResolvedValue({ reset: true });
    renderWithProviders(<ResetPasswordView />);
    await screen.findByLabelText(/^new password$/i);

    await user.type(screen.getByLabelText(/^new password$/i), "brandnewpassword");
    await user.type(screen.getByLabelText(/confirm new password/i), "brandnewpassword");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => expect(mockedConfirm).toHaveBeenCalledWith("abc123", "brandnewpassword"));
  });

  it("on success, tells the user they were signed out everywhere and routes to login (sessions are revoked)", async () => {
    const user = userEvent.setup();
    setUrl("token=abc123");
    mockedConfirm.mockResolvedValue({ reset: true });
    renderWithProviders(<ResetPasswordView />);
    await screen.findByLabelText(/^new password$/i);

    await user.type(screen.getByLabelText(/^new password$/i), "brandnewpassword");
    await user.type(screen.getByLabelText(/confirm new password/i), "brandnewpassword");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText(/signed out everywhere/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continue to login/i }));
    expect(openLogin).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/");
  });

  it("shows the generic invalid-or-expired state for TOKEN_INVALID", async () => {
    const user = userEvent.setup();
    setUrl("token=stale-token");
    mockedConfirm.mockRejectedValue(new ApiError(AuthErrorCode.TokenInvalid, "invalid", 400));
    renderWithProviders(<ResetPasswordView />);
    await screen.findByLabelText(/^new password$/i);

    await user.type(screen.getByLabelText(/^new password$/i), "brandnewpassword");
    await user.type(screen.getByLabelText(/confirm new password/i), "brandnewpassword");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
  });

  it("never logs or persists the raw reset token", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setUrl("token=super-secret-reset-token");
    renderWithProviders(<ResetPasswordView />);
    await screen.findByLabelText(/^new password$/i);

    const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls].flat().join(" ");
    expect(logged).not.toContain("super-secret-reset-token");
    const storage = JSON.stringify(localStorage).concat(JSON.stringify(sessionStorage));
    expect(storage).not.toContain("super-secret-reset-token");
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
