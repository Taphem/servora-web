import Image from "next/image";
import { cn } from "@/lib/utils";
import { brandAssets } from "@/lib/brand";

interface LogoProps {
  variant?: "default" | "inverse";
  showWordmark?: boolean;
  className?: string;
}

/**
 * The Servora mark, loaded from `src/lib/brand.ts` rather than hardcoded
 * here — swapping that file's paths for CDN URLs is the entire migration
 * once brand assets move to object storage.
 */
export function Logo({ variant = "default", showWordmark = true, className }: LogoProps) {
  const wordColor = variant === "inverse" ? "text-white" : "text-ink-900";
  const markSrc = variant === "inverse" ? brandAssets.logoMarkInverse : brandAssets.logoMark;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image src={markSrc} alt="" width={26} height={26} className="shrink-0" priority />
      {showWordmark ? (
        <span className={cn("font-display text-lg font-medium tracking-tight", wordColor)}>
          Servora
        </span>
      ) : (
        <span className="sr-only">Servora</span>
      )}
    </span>
  );
}
