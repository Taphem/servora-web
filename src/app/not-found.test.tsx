import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";
import { getSession } from "@/lib/auth/api";

vi.mock("@/lib/auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/api")>();
  return { ...actual, getSession: vi.fn() };
});

const mockedGetSession = vi.mocked(getSession);

describe("NotFound (app/not-found.tsx)", () => {
  beforeEach(() => {
    mockedGetSession.mockReset();
  });

  it("renders without any auth/session provider — it has no auth dependency at all", () => {
    // Deliberately rendered with NO AuthProvider/ToastProvider wrapper.
    // If this page needed auth context (useAuth(), a session check, a
    // Google/OTP call), this render would throw synchronously. It doesn't.
    expect(() => render(<NotFound />)).not.toThrow();
  });

  it("never calls getSession or any other auth endpoint just by rendering", () => {
    render(<NotFound />);
    expect(mockedGetSession).not.toHaveBeenCalled();
  });

  it("shows the 404 status as real, accessible content", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("shows a clear, human, Servora-toned not-found message", () => {
    render(<NotFound />);
    expect(screen.getByText(/took a wrong turn/i)).toBeInTheDocument();
    expect(screen.getByText(/doesn't exist or may have moved/i)).toBeInTheDocument();
  });

  it("uses a single, correct heading for the page", () => {
    render(<NotFound />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/wrong turn/i);
  });

  it("the primary action is a real link to the actual homepage", () => {
    render(<NotFound />);
    const homeLink = screen.getByRole("link", { name: /back to servora/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("the secondary action points to a real, existing destination — not an invented /explore route", () => {
    render(<NotFound />);
    const exploreLink = screen.getByRole("link", { name: /explore services/i });
    // Same anchor the real navbar uses (src/data/nav.ts) — a route that
    // genuinely exists, rather than a fabricated standalone page.
    expect(exploreLink).toHaveAttribute("href", "/#explore");
  });

  it("does not expose its decorative icon to assistive tech", () => {
    const { container } = render(<NotFound />);
    const decorativeIcon = container.querySelector("svg");
    expect(decorativeIcon).toHaveAttribute("aria-hidden", "true");
  });

  it("sets a Servora-branded, non-indexed page title", async () => {
    const mod = await import("@/app/not-found");
    expect(mod.metadata.title).toBe("Page Not Found | Servora");
    expect(mod.metadata.robots).toMatchObject({ index: false });
  });
});
