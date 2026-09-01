import { cn } from "@/lib/utils";

interface AvatarProps {
  initial: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

/** Initial-based avatar — no external image dependency required. */
export function Avatar({ initial, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-display font-medium text-brand-800",
        sizeStyles[size],
        className,
      )}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
