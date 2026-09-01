"use client";

import { motion } from "framer-motion";
import { Star, MapPin, CheckCircle2, BadgeCheck } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

export function HeroVisual() {
  const reduceMotion = usePrefersReducedMotion();

  const floatSlow = reduceMotion ? {} : { y: [0, -10, 0] };
  const floatSlowTransition = reduceMotion
    ? {}
    : { duration: 6, repeat: Infinity, ease: "easeInOut" as const };

  const floatFast = reduceMotion ? {} : { y: [0, -7, 0] };
  const floatFastTransition = reduceMotion
    ? {}
    : { duration: 5, repeat: Infinity, ease: "easeInOut" as const, delay: 0.6 };

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md sm:max-w-lg lg:max-w-none">
      {/* Base panel: an abstract "map" surface standing in for a real map */}
      <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] border border-border-default bg-gradient-to-br from-brand-900 via-brand-800 to-ink-900 shadow-lg">
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.16]"
          aria-hidden="true"
        >
          <pattern id="hero-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 25%, rgba(126,207,187,0.5), transparent 45%), radial-gradient(circle at 75% 70%, rgba(226,168,59,0.35), transparent 40%)",
          }}
          aria-hidden="true"
        />

        {/* Location pins suggesting nearby providers */}
        <span className="absolute left-[22%] top-[38%] flex h-3 w-3 items-center justify-center rounded-full bg-brand-300 shadow-[0_0_0_5px_rgba(126,207,187,0.25)]" />
        <span className="absolute left-[58%] top-[58%] flex h-2.5 w-2.5 items-center justify-center rounded-full bg-accent-300 shadow-[0_0_0_5px_rgba(226,168,59,0.25)]" />
        <span className="absolute left-[70%] top-[28%] flex h-2 w-2 items-center justify-center rounded-full bg-white/70 shadow-[0_0_0_4px_rgba(255,255,255,0.16)]" />

        <div className="absolute inset-x-6 bottom-6 flex items-center gap-2 text-white/70">
          <MapPin size={14} aria-hidden />
          <span className="text-xs font-medium tracking-wide">
            8 verified providers near you
          </span>
        </div>
      </div>

      {/* Floating card — best match */}
      <motion.div
        animate={floatSlow}
        transition={floatSlowTransition}
        className="absolute -left-4 top-[8%] w-[13.5rem] rounded-xl border border-border-default bg-surface-raised p-4 shadow-lg sm:-left-8 sm:w-60"
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <CategoryIcon name="Wind" size={18} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">CoolCare Services</p>
            <p className="truncate text-xs text-text-tertiary">AC &amp; HVAC · 2.1 km</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm font-semibold text-ink-900">
            <Star size={13} className="fill-accent-400 text-accent-400" aria-hidden />
            4.9
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-brand-700">
            <BadgeCheck size={13} aria-hidden />
            Verified
          </span>
        </div>
      </motion.div>

      {/* Floating card — availability / booking confirmation */}
      <motion.div
        animate={floatFast}
        transition={floatFastTransition}
        className="absolute -right-3 bottom-[10%] w-[12.5rem] rounded-xl border border-border-default bg-surface-raised p-4 shadow-lg sm:-right-6 sm:w-56"
      >
        <div className="mb-2 flex items-center gap-2 text-success-500">
          <CheckCircle2 size={16} aria-hidden />
          <span className="text-sm font-semibold text-ink-900">Booking confirmed</span>
        </div>
        <p className="text-xs leading-relaxed text-text-secondary">
          Tomorrow · 9:00 AM
          <br />
          ₹800–₹1,200 estimated
        </p>
      </motion.div>
    </div>
  );
}
