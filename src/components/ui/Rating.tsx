import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  reviewCount?: number;
  size?: "sm" | "md";
  className?: string;
}

export function Rating({ value, reviewCount, size = "sm", className }: RatingProps) {
  const starSize = size === "sm" ? 14 : 16;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="flex items-center" role="img" aria-label={`Rated ${value} out of 5`}>
        <Star size={starSize} className="fill-accent-400 text-accent-400" aria-hidden />
      </span>
      <span className={cn("font-semibold text-ink-900", size === "sm" ? "text-sm" : "text-base")}>
        {value.toFixed(1)}
      </span>
      {reviewCount !== undefined ? (
        <span className="text-sm text-text-tertiary">({reviewCount.toLocaleString("en-IN")})</span>
      ) : null}
    </div>
  );
}
