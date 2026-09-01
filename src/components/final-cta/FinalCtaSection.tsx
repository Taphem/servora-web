import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";

export function FinalCtaSection() {
  return (
    <section className="border-t border-border-subtle py-[var(--space-section-y)]">
      <Container>
        <AnimatedReveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.08] tracking-tight text-ink-900">
            Your next service is closer than you think.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-text-secondary sm:text-lg">
            Search, compare and book a trusted local provider in minutes —
            or bring your business to customers already looking.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              href="#top"
              icon={<ArrowRight size={17} aria-hidden />}
            >
              Find a service
            </Button>
            <Button variant="secondary" size="lg" href="#business">
              Become a provider
            </Button>
          </div>
        </AnimatedReveal>
      </Container>
    </section>
  );
}
