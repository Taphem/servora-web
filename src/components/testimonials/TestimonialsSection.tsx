import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Grid } from "@/components/ui/Grid";
import { TestimonialCard } from "@/components/testimonials/TestimonialCard";
import { reviews } from "@/data/reviews";

export function TestimonialsSection() {
  return (
    <Section tone="sunken" border>
      <SectionHeading eyebrow="Reviews" title="What customers are saying" className="max-w-xl" />

      <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="md" className="mt-10">
        {reviews.slice(0, 6).map((review, i) => (
          <TestimonialCard key={review.id} review={review} delay={(i % 3) * 0.06} />
        ))}
      </Grid>
    </Section>
  );
}
