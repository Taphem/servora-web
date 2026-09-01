import { Star, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AIMatchCardProps {
  providerName: string;
  rating: number;
  distanceKm: number;
  availability: string;
  priceRange: string;
}

export function AIMatchCard({
  providerName,
  rating,
  distanceKm,
  availability,
  priceRange,
}: AIMatchCardProps) {
  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
        Best match for you
      </p>
      <p className="font-medium text-ink-900">{providerName}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-secondary">
        <span className="flex items-center gap-1 font-medium text-ink-900">
          <Star size={13} className="fill-accent-400 text-accent-400" aria-hidden />
          {rating.toFixed(1)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={13} className="text-text-tertiary" aria-hidden />
          {distanceKm} km
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} className="text-text-tertiary" aria-hidden />
          {availability}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-900">{priceRange}</span>
        <Button size="sm" variant="primary">
          View match
        </Button>
      </div>
    </div>
  );
}
