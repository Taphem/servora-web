import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconButtonVariant = "default" | "ghost" | "inverse";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  /** Required — IconButton has no visible label, so this is its accessible name. */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  className?: string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  default:
    "text-ink-700 hover:bg-ink-900/[0.06] hover:text-ink-900 border border-transparent",
  ghost: "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
  inverse: "text-white hover:bg-white/10",
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

/** Icon-only button — always requires an aria-label since there's no visible text. */
export function IconButton({
  icon,
  variant = "default",
  size = "md",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-[var(--duration-hover)] ease-[var(--ease-out-premium)] active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
