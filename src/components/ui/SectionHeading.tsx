import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "default" | "inverse";
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "default",
  className,
  titleClassName,
}: SectionHeadingProps) {
  return (
    <AnimatedReveal
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]",
            align === "center" && "justify-center",
            tone === "inverse" ? "text-brand-300" : "text-brand-700",
          )}
        >
          <span
            aria-hidden
            className={cn("h-1.5 w-1.5 rounded-full", tone === "inverse" ? "bg-brand-300" : "bg-brand-500")}
          />
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-display text-h2",
          tone === "inverse" ? "text-white" : "text-ink-900",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            tone === "inverse" ? "text-ink-300" : "text-text-secondary",
          )}
        >
          {description}
        </p>
      ) : null}
    </AnimatedReveal>
  );
}
