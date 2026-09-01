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
import { cn } from "@/lib/utils";

export function Navbar() {
  const scrolled = useScrolled(16);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          <Button variant="ghost" size="sm">
            Log in
          </Button>
          <Button variant="primary" size="sm">
            Get started
          </Button>
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
          <Button variant="secondary" size="md">
            Log in
          </Button>
          <Button variant="primary" size="md">
            Get started
          </Button>
        </div>
      </Drawer>
    </header>
  );
}
