import { Quote } from "lucide-react";
import type { Review } from "@/types/domain";
import { Avatar } from "@/components/ui/Avatar";
import { Rating } from "@/components/ui/Rating";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";

export function TestimonialCard({ review, delay = 0 }: { review: Review; delay?: number }) {
  return (
    <AnimatedReveal
      delay={delay}
      className="flex h-full flex-col justify-between rounded-lg border border-border-default bg-surface-raised p-6"
    >
      <div>
        <Quote className="mb-3 text-brand-300" size={22} aria-hidden />
        <p className="text-[0.95rem] leading-relaxed text-ink-800">&ldquo;{review.quote}&rdquo;</p>
      </div>
      <div className="mt-6 flex items-center gap-3 border-t border-border-subtle pt-5">
        <Avatar initial={review.authorInitial} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-900">{review.authorName}</p>
          <p className="truncate text-xs text-text-tertiary">
            {review.serviceCategory} · {review.date}
          </p>
        </div>
        <Rating value={review.rating} />
      </div>
    </AnimatedReveal>
  );
}
