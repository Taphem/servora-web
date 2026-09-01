"use client";

import { MapPin, Clock } from "lucide-react";
import type { Provider } from "@/types/domain";
import { Modal } from "@/components/ui/Modal";
import { ProviderMedia } from "@/components/ui/ProviderMedia";
import { Rating } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { TrustSignalList } from "@/components/trust/TrustSignalList";
import { useToast } from "@/components/ui/Toast";
import { formatPriceRange } from "@/lib/utils";

interface ProviderProfileModalProps {
  provider: Provider;
  open: boolean;
  onClose: () => void;
}

export function ProviderProfileModal({ provider, open, onClose }: ProviderProfileModalProps) {
  const { showToast } = useToast();

  return (
    <Modal open={open} onClose={onClose} title={provider.name}>
      <ProviderMedia
        seed={provider.imageUrl}
        categoryId={provider.categoryId}
        className="mb-4 h-32 w-full rounded-md"
      />

      <p className="text-sm text-text-secondary">{provider.tagline}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Rating value={provider.rating} reviewCount={provider.reviewCount} />
        <span className="flex items-center gap-1.5 text-text-secondary">
          <MapPin size={14} className="text-text-tertiary" aria-hidden />
          {provider.distanceKm} km away
        </span>
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Clock size={14} className="text-text-tertiary" aria-hidden />
          {provider.nextAvailable}
        </span>
      </div>

      <div className="mt-5 rounded-md bg-ink-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          Estimated price
        </p>
        <p className="mt-1 text-lg font-semibold text-ink-900">
          {formatPriceRange(provider.priceMin, provider.priceMax)}
        </p>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          Verified details
        </p>
        <TrustSignalList signals={provider.verificationSignals} />
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => {
            onClose();
            showToast("Booking isn't live yet — you're seeing a preview.");
          }}
        >
          Request booking
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
