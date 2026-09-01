"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Search, ListChecks, CalendarCheck, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

const stages = [
  {
    order: "01",
    label: "Discover",
    icon: Search,
    heading: "See who's actually available nearby",
    description:
      "Search by what you need, or just describe it in your own words.",
    range: [0, 0.25] as const,
  },
  {
    order: "02",
    label: "Compare",
    icon: ListChecks,
    heading: "Compare without the guesswork",
    description:
      "Rating, price and distance, side by side — no more opening five tabs.",
    range: [0.25, 0.5] as const,
  },
  {
    order: "03",
    label: "Book",
    icon: CalendarCheck,
    heading: "Book a time that works",
    description:
      "Pick a slot and confirm — no calls, no waiting to hear back.",
    range: [0.5, 0.75] as const,
  },
  {
    order: "04",
    label: "Done",
    icon: CheckCircle2,
    heading: "Know it's taken care of",
    description:
      "Track your booking, message your provider, and leave a review once it's done.",
    range: [0.75, 1] as const,
  },
];

function StagePanel({
  stage,
  progress,
}: {
  stage: (typeof stages)[number];
  progress: MotionValue<number>;
}) {
  const [start, end] = stage.range;
  const opacity = useTransform(progress, [start, (start + end) / 2, end], [0, 1, 0]);
  const y = useTransform(progress, [start, (start + end) / 2, end], [24, 0, -24]);
  const Icon = stage.icon;

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-4 -right-2 select-none font-display text-8xl font-medium text-brand-100 sm:text-9xl"
      >
        {stage.order}
      </span>
      <div className="relative max-w-md p-6 sm:p-8">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Icon size={20} aria-hidden />
        </span>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
          {stage.label}
        </p>
        <h3 className="font-display text-2xl font-medium leading-tight text-ink-900 sm:text-3xl">
          {stage.heading}
        </h3>
        <p className="mt-4 text-base leading-relaxed text-text-secondary">{stage.description}</p>
      </div>
    </motion.div>
  );
}

export function DiscoverCompareBookSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const heading = (
    <SectionHeading
      eyebrow="How it works"
      title="From search to done, in a few taps"
      description="No calls, no comparing tabs, no waiting to hear back."
      align="center"
      className="mx-auto"
    />
  );

  if (reduceMotion) {
    return (
      <section id="how-it-works" className="border-t border-border-subtle py-[var(--space-section-y)]">
        <Container>
          {heading}
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div key={stage.label}>
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Icon size={20} aria-hidden />
                  </span>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
                    {stage.label}
                  </p>
                  <h3 className="font-display text-xl font-medium text-ink-900">{stage.heading}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{stage.description}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section id="how-it-works" className="relative border-t border-border-subtle">
      <Container className="pt-[var(--space-section-y)]">{heading}</Container>
      <div ref={trackRef} className="relative h-[320vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <Container className="grid w-full items-center gap-12 lg:grid-cols-2">
            <div className="relative h-64 overflow-hidden rounded-xl border border-border-default bg-surface-raised shadow-xs sm:h-72">
              {stages.map((stage) => (
                <StagePanel key={stage.label} stage={stage} progress={scrollYProgress} />
              ))}
            </div>

            <div className="hidden flex-col gap-2 lg:flex">
              {stages.map((stage, i) => (
                <StageRow
                  key={stage.label}
                  stage={stage}
                  progress={scrollYProgress}
                  isLast={i === stages.length - 1}
                />
              ))}
            </div>
          </Container>

          <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center lg:hidden">
            <div className="flex items-center gap-2">
              {stages.map((stage, i) => (
                <StageDot
                  key={stage.label}
                  progress={scrollYProgress}
                  range={stage.range}
                  isLast={i === stages.length - 1}
                  label={stage.label}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StageRow({
  stage,
  progress,
  isLast,
}: {
  stage: (typeof stages)[number];
  progress: MotionValue<number>;
  isLast: boolean;
}) {
  const [start, end] = stage.range;
  const isActive = (v: number) => v >= start && v < (isLast ? 1.01 : end);
  const background = useTransform(progress, (v) =>
    isActive(v) ? "var(--color-brand-50)" : "transparent",
  );
  const iconBackground = useTransform(progress, (v) =>
    isActive(v) ? "var(--color-brand-600)" : "var(--color-ink-100)",
  );
  const iconColor = useTransform(progress, (v) =>
    isActive(v) ? "var(--color-white)" : "var(--color-ink-400)",
  );
  const textColor = useTransform(progress, (v) =>
    isActive(v) ? "var(--color-ink-900)" : "var(--color-text-tertiary)",
  );
  const Icon = stage.icon;

  return (
    <motion.div
      style={{ backgroundColor: background }}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
    >
      <motion.span
        style={{ backgroundColor: iconBackground, color: iconColor }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      >
        <Icon size={14} aria-hidden />
      </motion.span>
      <motion.span style={{ color: textColor }} className="text-sm font-medium">
        {stage.order} — {stage.label}
      </motion.span>
    </motion.div>
  );
}

function StageDot({
  progress,
  range,
  isLast,
  label,
  compact = false,
}: {
  progress: MotionValue<number>;
  range: readonly [number, number];
  isLast: boolean;
  label: string;
  compact?: boolean;
}) {
  const [start, end] = range;
  const width = useTransform(progress, (v) => {
    const isActive = v >= start && v < (isLast ? 1.01 : end);
    return isActive ? (compact ? 24 : 40) : 8;
  });
  const opacity = useTransform(progress, (v) => {
    const isActive = v >= start && v < (isLast ? 1.01 : end);
    return isActive ? 1 : 0.35;
  });

  return (
    <motion.span
      style={{ width, opacity }}
      className={cn("rounded-full bg-brand-600", compact ? "h-1.5" : "h-2")}
      aria-label={label}
    />
  );
}
