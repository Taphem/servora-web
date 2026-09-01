import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { featuredProviders } from "@/data/providers";
import { ArrowRight } from "lucide-react";

export function ProvidersSection() {
  return (
    <section id="explore" className="border-t border-border-subtle bg-surface-sunken py-[var(--space-section-y)]">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Featured providers"
            title="Ready to book, near you"
            description="Real ratings, pricing and availability shown upfront — no calling around to find out."
            className="max-w-xl"
          />
          <Button
            variant="secondary"
            icon={<ArrowRight size={16} aria-hidden />}
            className="shrink-0"
            disabled
            title="Coming soon"
          >
            View all providers
          </Button>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
