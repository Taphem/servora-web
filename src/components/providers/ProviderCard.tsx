"use client";

import { useState } from "react";
import { MapPin, Clock, ShieldCheck } from "lucide-react";
import type { Provider } from "@/types/domain";
import { ProviderMedia } from "@/components/ui/ProviderMedia";
import { Rating } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { ProviderProfileModal } from "@/components/providers/ProviderProfileModal";
import { formatPriceRange } from "@/lib/utils";

export function ProviderCard({ provider }: { provider: Provider }) {
  const [open, setOpen] = useState(false);

  return (
    <AnimatedReveal as="li" className="list-none">
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border-default bg-surface-raised transition-all duration-[var(--duration-base)] ease-[var(--ease-out-premium)] hover:-translate-y-1 hover:shadow-md">
        <ProviderMedia
          seed={provider.imageUrl}
          categoryId={provider.categoryId}
          className="h-40 w-full"
        />

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-medium text-ink-900">{provider.name}</h3>
              <p className="mt-0.5 text-sm text-text-tertiary">{provider.categoryName}</p>
            </div>
            {provider.verificationSignals.includes("BUSINESS_VERIFIED") ? (
              <span
                className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-[0.7rem] font-medium text-brand-700"
                title="Business verified"
              >
                <ShieldCheck size={12} aria-hidden />
                Verified
              </span>
            ) : null}
          </div>

          <Rating value={provider.rating} reviewCount={provider.reviewCount} />

          <div className="flex flex-col gap-1.5 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-text-tertiary" aria-hidden />
              {provider.distanceKm} km away
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-text-tertiary" aria-hidden />
              {provider.nextAvailable}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between border-t border-border-subtle pt-4">
            <span className="text-sm font-semibold text-ink-900">
              {formatPriceRange(provider.priceMin, provider.priceMax)}
            </span>
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
              View profile
            </Button>
          </div>
        </div>
      </div>

      <ProviderProfileModal
        provider={provider}
        open={open}
        onClose={() => setOpen(false)}
      />
    </AnimatedReveal>
  );
}
