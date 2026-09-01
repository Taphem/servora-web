import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TestimonialCard } from "@/components/testimonials/TestimonialCard";
import { reviews } from "@/data/reviews";

export function TestimonialsSection() {
  return (
    <section className="border-t border-border-subtle bg-surface-sunken py-[var(--space-section-y)]">
      <Container>
        <SectionHeading
          eyebrow="Reviews"
          title="What customers are saying"
          className="max-w-xl"
        />

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((review, i) => (
            <TestimonialCard key={review.id} review={review} delay={(i % 3) * 0.06} />
          ))}
        </div>
      </Container>
    </section>
  );
}
