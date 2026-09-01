import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type StackGap = "xs" | "sm" | "md" | "lg" | "xl";
type StackAlign = "start" | "center" | "end" | "stretch";

interface StackProps {
  children: ReactNode;
  direction?: "row" | "column";
  gap?: StackGap;
  align?: StackAlign;
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  as?: ElementType;
  className?: string;
}

const gapStyles: Record<StackGap, string> = {
  xs: "gap-1.5",
  sm: "gap-3",
  md: "gap-5",
  lg: "gap-8",
  xl: "gap-12",
};

const alignStyles: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyStyles: Record<NonNullable<StackProps["justify"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

/** Flex layout primitive — a single place to control gap/alignment instead of ad-hoc flex classes. */
export function Stack({
  children,
  direction = "column",
  gap = "md",
  align = "stretch",
  justify,
  wrap = false,
  as: Tag = "div",
  className,
}: StackProps) {
  return (
    <Tag
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        gapStyles[gap],
        alignStyles[align],
        justify && justifyStyles[justify],
        wrap && "flex-wrap",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
