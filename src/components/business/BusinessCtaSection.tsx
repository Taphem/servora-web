import { CalendarRange, Users, CreditCard, LineChart, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";

const benefits = [
  { icon: CalendarRange, label: "Manage your availability" },
  { icon: Users, label: "Keep track of customers" },
  { icon: CreditCard, label: "Get paid without chasing" },
  { icon: LineChart, label: "See what's working" },
];

export function BusinessCtaSection() {
  return (
    <section id="business" className="py-[var(--space-section-y)]">
      <Container>
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 px-6 py-14 sm:px-12 sm:py-16 lg:px-16">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-accent-400/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
            <AnimatedReveal>
              <Badge tone="inverse">For businesses</Badge>
              <h2 className="mt-5 max-w-lg font-display text-[clamp(1.75rem,3.6vw,2.5rem)] font-medium leading-[1.12] text-white">
                Turn your service into a business customers can find.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-ink-300">
                A separate business portal gives you the tools to manage
                bookings, staff, payments and performance — all in one
                place.
              </p>
              <div className="mt-8">
                <Button
                  variant="inverse"
                  size="lg"
                  icon={<ArrowRight size={17} aria-hidden />}
                >
                  Become a provider
                </Button>
              </div>
            </AnimatedReveal>

            <AnimatedReveal delay={0.1}>
              <ul className="grid grid-cols-2 gap-3">
                {benefits.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-300">
                      <Icon size={16} aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-white">{label}</span>
                  </li>
                ))}
              </ul>
            </AnimatedReveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
