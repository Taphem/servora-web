import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "inverse";
  showWordmark?: boolean;
  className?: string;
}

/**
 * Minimal custom mark — a signal/locate glyph rendered in currentColor,
 * paired with the SERVORA wordmark in the display typeface. No external
 * or third-party logo assets are used.
 */
export function Logo({ variant = "default", showWordmark = true, className }: LogoProps) {
  const markColor = variant === "inverse" ? "text-white" : "text-brand-700";
  const wordColor = variant === "inverse" ? "text-white" : "text-ink-900";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 28 28"
        fill="none"
        className={cn("shrink-0", markColor)}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="26" height="26" rx="8" fill="currentColor" opacity="0.12" />
        <path
          d="M9 18.5c0-3.3 2.2-5.5 5-5.5s5 2.2 5 5.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="14" cy="9.5" r="2.4" fill="currentColor" />
      </svg>
      {showWordmark ? (
        <span
          className={cn(
            "font-display text-lg font-medium tracking-tight",
            wordColor,
          )}
        >
          Servora
        </span>
      ) : (
        <span className="sr-only">Servora</span>
      )}
    </span>
  );
}
