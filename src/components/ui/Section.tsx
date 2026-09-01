import type { ElementType, ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

type SectionTone = "default" | "sunken" | "inverse";
type SectionSpacing = "default" | "compact" | "none";

interface SectionProps {
  id?: string;
  children: ReactNode;
  tone?: SectionTone;
  spacing?: SectionSpacing;
  border?: boolean;
  /** Renders children directly, without wrapping them in a Container. */
  unwrapped?: boolean;
  as?: ElementType;
  className?: string;
}

const toneStyles: Record<SectionTone, string> = {
  default: "",
  sunken: "bg-surface-sunken",
  inverse: "bg-ink-950 text-white",
};

const spacingStyles: Record<SectionSpacing, string> = {
  default: "py-[var(--space-section-y)]",
  compact: "py-[var(--space-section-y-sm)]",
  none: "",
};

/**
 * Standard page section: consistent vertical rhythm and background tone,
 * so individual sections don't each hand-roll their own padding scale.
 */
export function Section({
  id,
  children,
  tone = "default",
  spacing = "default",
  border = false,
  unwrapped = false,
  as: Tag = "section",
  className,
}: SectionProps) {
  return (
    <Tag
      id={id}
      className={cn(
        toneStyles[tone],
        spacingStyles[spacing],
        border && "border-t border-border-subtle",
        className,
      )}
    >
      {unwrapped ? children : <Container>{children}</Container>}
    </Tag>
  );
}
