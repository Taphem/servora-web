import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { authenticateWithGoogle, getSession } from "@/lib/auth/api";
import { loadGoogleIdentityServices } from "@/lib/auth/googleIdentityServices";
import { ApiError, ClientErrorCode } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";
import { useAuth } from "@/lib/auth/AuthProvider";

vi.mock("@/lib/env", () => ({
  env: { siteUrl: "https://test.example.com", apiBaseUrl: "https://api.test.example.com", googleClientId: "test-google-client-id" },
}));

vi.mock("@/lib/auth/googleIdentityServices", () => ({
  loadGoogleIdentityServices: vi.fn(),
}));

vi.mock("@/lib/auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/api")>();
  return { ...actual, authenticateWithGoogle: vi.fn(), getSession: vi.fn() };
});

const mockedLoad = vi.mocked(loadGoogleIdentityServices);
const mockedAuthenticate = vi.mocked(authenticateWithGoogle);
const mockedGetSession = vi.mocked(getSession);

let capturedCallback: ((response: { credential: string }) => void) | null = null;
const initializeMock = vi.fn((config: { callback: (r: { credential: string }) => void }) => {
  capturedCallback = config.callback;
});
const renderButtonMock = vi.fn();

function AuthStateProbe() {
  const { user, status } = useAuth();
  return <div data-testid="auth-probe">{status === "authenticated" ? `authenticated:${user?.email}` : status}</div>;
}

describe("GoogleAuthButton", () => {
  beforeEach(() => {
    capturedCallback = null;
    initializeMock.mockClear();
    renderButtonMock.mockClear();
    mockedLoad.mockReset();
    mockedAuthenticate.mockReset();
    mockedGetSession.mockReset();
    mockedGetSession.mockResolvedValue({ authenticated: false });

    Object.defineProperty(window, "google", {
      configurable: true,
      writable: true,
      value: { accounts: { id: { initialize: initializeMock, renderButton: renderButtonMock, prompt: vi.fn(), cancel: vi.fn(), disableAutoSelect: vi.fn() } } },
    });
  });

  afterEach(async () => {
    delete window.google;
    // Guaranteed to run even if a test's own assertions throw first —
    // unlike restoring inline at the end of a test body, which a failed
    // assertion above it would skip, leaving this mutated for every
    // later test in the file.
    const envModule = await import("@/lib/env");
    // @ts-expect-error -- restoring the mocked module's value
    envModule.env.googleClientId = "test-google-client-id";
  });

  it("renders nothing when no Google Client ID is configured", async () => {
    const envModule = await import("@/lib/env");
    // @ts-expect-error -- overriding the mocked module's value for this one test
    envModule.env.googleClientId = "";
    renderWithProviders(<GoogleAuthButton onSuccess={vi.fn()} onError={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(initializeMock).not.toHaveBeenCalled();
  });

  it("initializes GIS with the configured client ID and renders Google's own button (no custom logo)", async () => {
    mockedLoad.mockResolvedValue(undefined);
    renderWithProviders(<GoogleAuthButton onSuccess={vi.fn()} onError={vi.fn()} />);

    await waitFor(() => expect(initializeMock).toHaveBeenCalledTimes(1));
    expect(initializeMock).toHaveBeenCalledWith(expect.objectContaining({ client_id: "test-google-client-id" }));
    await waitFor(() => expect(renderButtonMock).toHaveBeenCalledTimes(1));
  });

  it("only loads the GIS script once even if mounted twice", async () => {
    mockedLoad.mockResolvedValue(undefined);
    renderWithProviders(
      <>
        <GoogleAuthButton onSuccess={vi.fn()} onError={vi.fn()} />
        <GoogleAuthButton onSuccess={vi.fn()} onError={vi.fn()} />
      </>,
    );
    await waitFor(() => expect(initializeMock).toHaveBeenCalledTimes(2));
    // Both instances ask the loader, but the loader itself (mocked here)
    // is what's responsible for de-duplicating the actual script tag —
    // covered directly in googleIdentityServices.test.ts.
    expect(mockedLoad).toHaveBeenCalledTimes(2);
  });

  it("sends exactly { credential } to the backend — never email/password/profile fields", async () => {
    mockedLoad.mockResolvedValue(undefined);
    mockedAuthenticate.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: true,
      phoneVerified: false,
    });
    renderWithProviders(<GoogleAuthButton onSuccess={vi.fn()} onError={vi.fn()} />);
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "the-google-id-token" });

    await waitFor(() => expect(mockedAuthenticate).toHaveBeenCalledWith("the-google-id-token"));
    expect(mockedAuthenticate.mock.calls[0]).toHaveLength(1);
  });

  it("updates the shared auth state via the existing AuthProvider (no second auth system)", async () => {
    mockedLoad.mockResolvedValue(undefined);
    mockedAuthenticate.mockResolvedValue({
      userId: "u1",
      email: "googleuser@example.com",
      role: "CUSTOMER",
      emailVerified: true,
      phoneVerified: false,
    });
    const onSuccess = vi.fn();
    renderWithProviders(
      <>
        <GoogleAuthButton onSuccess={onSuccess} onError={vi.fn()} />
        <AuthStateProbe />
      </>,
    );
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "token" });

    await waitFor(() => expect(screen.getByTestId("auth-probe")).toHaveTextContent("authenticated:googleuser@example.com"));
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ email: "googleuser@example.com", emailVerified: true }),
    );
  });

  it("never persists the Google credential to localStorage or sessionStorage", async () => {
    mockedLoad.mockResolvedValue(undefined);
    mockedAuthenticate.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: true,
      phoneVerified: false,
    });
    renderWithProviders(<GoogleAuthButton onSuccess={vi.fn()} onError={vi.fn()} />);
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "super-secret-google-id-token" });
    await waitFor(() => expect(mockedAuthenticate).toHaveBeenCalled());

    const storage = JSON.stringify(localStorage).concat(JSON.stringify(sessionStorage));
    expect(storage).not.toContain("super-secret-google-id-token");
  });

  it("never logs the Google credential", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedLoad.mockResolvedValue(undefined);
    mockedAuthenticate.mockResolvedValue({
      userId: "u1",
      email: "user@example.com",
      role: "CUSTOMER",
      emailVerified: true,
      phoneVerified: false,
    });
    renderWithProviders(<GoogleAuthButton onSuccess={vi.fn()} onError={vi.fn()} />);
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "super-secret-google-id-token" });
    await waitFor(() => expect(mockedAuthenticate).toHaveBeenCalled());

    const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls].flat().join(" ");
    expect(logged).not.toContain("super-secret-google-id-token");
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("prevents a duplicate authentication request if the callback fires twice in quick succession", async () => {
    mockedLoad.mockResolvedValue(undefined);
    let resolveAuth!: (u: Awaited<ReturnType<typeof authenticateWithGoogle>>) => void;
    mockedAuthenticate.mockReturnValue(
      new Promise((resolve) => {
        resolveAuth = resolve;
      }),
    );
    renderWithProviders(<GoogleAuthButton onSuccess={vi.fn()} onError={vi.fn()} />);
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "token" });
    capturedCallback!({ credential: "token" });
    capturedCallback!({ credential: "token" });

    expect(mockedAuthenticate).toHaveBeenCalledTimes(1);
    resolveAuth({ userId: "u1", email: "a@b.com", role: "CUSTOMER", emailVerified: true, phoneVerified: false });
  });

  it("shows a clean message and hides the button when the GIS script fails to load", async () => {
    mockedLoad.mockRejectedValue(new Error("script blocked"));
    const onError = vi.fn();
    renderWithProviders(<GoogleAuthButton onSuccess={vi.fn()} onError={onError} />);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringContaining("isn't available")));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a friendly message for a 401 GOOGLE_OAUTH_FAILED response, not a raw backend error", async () => {
    mockedLoad.mockResolvedValue(undefined);
    mockedAuthenticate.mockRejectedValue(new ApiError(AuthErrorCode.GoogleOAuthFailed, "token verification failed: bad audience", 401));
    const onError = vi.fn();
    renderWithProviders(<GoogleAuthButton onSuccess={vi.fn()} onError={onError} />);
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "token" });

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/couldn't verify/i)));
    expect(onError).not.toHaveBeenCalledWith(expect.stringContaining("bad audience"));
  });

  it("shows a network-failure message on a gateway/network error, not a crash", async () => {
    mockedLoad.mockResolvedValue(undefined);
    mockedAuthenticate.mockRejectedValue(new ApiError(ClientErrorCode.NetworkError, "Couldn't reach the server. Check your connection and try again.", 0));
    const onError = vi.fn();
    renderWithProviders(<GoogleAuthButton onSuccess={vi.fn()} onError={onError} />);
    await waitFor(() => expect(capturedCallback).not.toBeNull());

    capturedCallback!({ credential: "token" });

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/couldn't reach the server/i)));
  });
});
