import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type GridGap = "xs" | "sm" | "md" | "lg" | "xl";

interface GridProps {
  children: ReactNode;
  /** Column count per breakpoint. Omitted breakpoints inherit the previous one. */
  cols?: { base?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: GridGap;
  as?: ElementType;
  className?: string;
}

const gapStyles: Record<GridGap, string> = {
  xs: "gap-3",
  sm: "gap-4",
  md: "gap-5",
  lg: "gap-8",
  xl: "gap-12",
};

// Tailwind needs complete class strings at build time — this map keeps
// every grid-cols-N utility this component can emit statically visible.
const colsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12",
};
const smColsMap: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
  12: "sm:grid-cols-12",
};
const mdColsMap: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  12: "md:grid-cols-12",
};
const lgColsMap: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  12: "lg:grid-cols-12",
};
const xlColsMap: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
  12: "xl:grid-cols-12",
};

/** Responsive grid primitive — declare column counts per breakpoint instead of hand-writing grid-cols-* chains. */
export function Grid({ children, cols = { base: 1 }, gap = "md", as: Tag = "div", className }: GridProps) {
  return (
    <Tag
      className={cn(
        "grid",
        cols.base && colsMap[cols.base],
        cols.sm && smColsMap[cols.sm],
        cols.md && mdColsMap[cols.md],
        cols.lg && lgColsMap[cols.lg],
        cols.xl && xlColsMap[cols.xl],
        gapStyles[gap],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
