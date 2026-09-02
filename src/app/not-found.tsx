import type { Metadata } from "next";
import { MapPinOff } from "lucide-react";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { primaryNavLinks } from "@/data/nav";

export const metadata: Metadata = {
  title: "Page Not Found | Servora",
  robots: { index: false, follow: false },
};

// Reuses the homepage's own "Explore" anchor rather than inventing a
// standalone /explore route that doesn't exist — this is the same link
// the navbar already uses (see src/data/nav.ts), pointed at "/" so it
// resolves correctly no matter which broken URL this page renders from.
const exploreHref = `/${primaryNavLinks[0].href}`;

/**
 * The App Router's built-in not-found mechanism: this file renders
 * automatically for any request that matches no route (no catch-all
 * page needed) and for any in-app notFound() call, with a real HTTP 404
 * status — Next.js handles that, nothing here sets a status code.
 * Rendered inside the existing root layout, so the real Navbar/Footer
 * and auth state already apply; nothing on this page requests a
 * session, and nothing here needs to duplicate the site chrome.
 */
export default function NotFound() {
  return (
    <PageWrapper>
      <section className="flex min-h-[65vh] items-center py-16">
        <Container className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="relative flex items-center justify-center">
            <p className="font-display text-[5.5rem] leading-none text-primary/10 sm:text-[8rem]">404</p>
            <span
              aria-hidden
              className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-text-brand"
            >
              <MapPinOff size={26} aria-hidden />
            </span>
          </div>

          <h1 className="mt-2 font-display text-h1 text-ink-900">
            Looks like this service took a wrong turn.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-text-secondary sm:text-lg">
            The page you&apos;re looking for doesn&apos;t exist or may have moved.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
            <Button href="/" variant="primary" size="lg" className="w-full sm:w-auto">
              Back to Servora
            </Button>
            <Button href={exploreHref} variant="secondary" size="lg" className="w-full sm:w-auto">
              Explore services
            </Button>
          </div>
        </Container>
      </section>
    </PageWrapper>
  );
}
