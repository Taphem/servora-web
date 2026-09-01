import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { AuthModalProvider, useAuthModal } from "@/components/auth/AuthModalProvider";
import { getSession } from "@/lib/auth/api";

vi.mock("@/lib/auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/api")>();
  return { ...actual, getSession: vi.fn() };
});

vi.mocked(getSession).mockResolvedValue({ authenticated: false });

function TestHost() {
  const { openLogin, openSignup, close } = useAuthModal();
  return (
    <div>
      <button onClick={openLogin}>open-login</button>
      <button onClick={openSignup}>open-signup</button>
      <button onClick={close}>close</button>
    </div>
  );
}

describe("AuthModalProvider / AuthModal", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockClear();
  });

  it("is closed by default", () => {
    renderWithProviders(
      <AuthModalProvider>
        <TestHost />
      </AuthModalProvider>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the login modal via openLogin()", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AuthModalProvider>
        <TestHost />
      </AuthModalProvider>,
    );

    await user.click(screen.getByText("open-login"));
    expect(await screen.findByRole("dialog", { name: /log in/i })).toBeInTheDocument();
  });

  it("opens the signup modal via openSignup()", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AuthModalProvider>
        <TestHost />
      </AuthModalProvider>,
    );

    await user.click(screen.getByText("open-signup"));
    expect(await screen.findByRole("dialog", { name: /create your account/i })).toBeInTheDocument();
  });

  it("switches from login to signup and back inside the modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AuthModalProvider>
        <TestHost />
      </AuthModalProvider>,
    );

    await user.click(screen.getByText("open-login"));
    await screen.findByRole("dialog", { name: /log in/i });

    await user.click(screen.getByRole("button", { name: /sign up/i }));
    expect(await screen.findByRole("dialog", { name: /create your account/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByRole("dialog", { name: /^log in$/i })).toBeInTheDocument();
  });

  it("closes on close() and on Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AuthModalProvider>
        <TestHost />
      </AuthModalProvider>,
    );

    await user.click(screen.getByText("open-login"));
    await screen.findByRole("dialog");
    await user.click(screen.getByText("close"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByText("open-login"));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
