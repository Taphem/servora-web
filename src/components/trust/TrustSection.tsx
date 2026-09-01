import { BadgeCheck, MessageSquareText, Tags } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";

const highlights = [
  {
    icon: BadgeCheck,
    label: "Verified contact details",
    description: "Every provider's identity and business details are checked before they can list.",
  },
  {
    icon: MessageSquareText,
    label: "Reviews from real bookings",
    description: "Ratings only come from customers who actually completed a booking.",
  },
  {
    icon: Tags,
    label: "Clear pricing, no surprises",
    description: "See what you'll pay and when someone's free — before you reach out.",
  },
];

export function TrustSection() {
  return (
    <section className="border-t border-border-subtle py-[var(--space-section-y)]">
      <Container>
        <SectionHeading
          eyebrow="Trust"
          title="Know who you're booking"
          description="Every listing shows what's actually been checked, so you can decide with real information instead of a blind rating."
          align="center"
          className="mx-auto"
        />

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border-default bg-border-default sm:grid-cols-3">
          {highlights.map((item, i) => {
            const Icon = item.icon;
            return (
              <AnimatedReveal
                key={item.label}
                delay={i * 0.08}
                className="flex flex-col gap-3 bg-surface-raised p-6 text-center sm:items-center"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Icon size={18} aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-ink-900">{item.label}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                    {item.description}
                  </p>
                </div>
              </AnimatedReveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
