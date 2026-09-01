"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Drawer } from "@/components/ui/Drawer";
import { primaryNavLinks } from "@/data/nav";
import { useScrolled } from "@/hooks/useScrolled";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { cn } from "@/lib/utils";

export function Navbar() {
  const scrolled = useScrolled(16);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, status, signOut } = useAuth();
  const { openLogin, openSignup } = useAuthModal();

  const isAuthenticated = status === "authenticated" && user !== null;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[var(--z-nav)] transition-all duration-[var(--duration-base)] ease-[var(--ease-out-premium)]",
        scrolled
          ? "border-b border-border-subtle bg-surface/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-[4.5rem] items-center justify-between py-3.5 sm:h-20">
        <a href="#top" className="rounded-sm" aria-label="Servora home">
          <Logo />
        </a>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 lg:flex"
        >
          {primaryNavLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 transition-colors duration-[var(--duration-fast)] hover:bg-ink-900/[0.04] hover:text-ink-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <>
              <span className="max-w-[12rem] truncate px-2 text-sm text-ink-600" title={user.email}>
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={openLogin}>
                Log in
              </Button>
              <Button variant="primary" size="sm" onClick={openSignup}>
                Get started
              </Button>
            </>
          )}
        </div>

        <IconButton
          icon={<Menu size={22} aria-hidden />}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="lg:hidden"
        />
      </Container>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Menu">
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {primaryNavLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setDrawerOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium text-ink-800 transition-colors hover:bg-ink-50"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 pt-8">
          {isAuthenticated ? (
            <>
              <p className="truncate px-1 text-sm text-ink-600">{user.email}</p>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setDrawerOpen(false);
                  void signOut();
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setDrawerOpen(false);
                  openLogin();
                }}
              >
                Log in
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setDrawerOpen(false);
                  openSignup();
                }}
              >
                Get started
              </Button>
            </>
          )}
        </div>
      </Drawer>
    </header>
  );
}
