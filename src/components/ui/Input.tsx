import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className, ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={cn(
          "h-11 rounded-md border border-border-default bg-surface-raised px-4 text-sm text-ink-900 placeholder:text-text-tertiary transition-colors duration-[var(--duration-fast)] focus:border-brand-500",
          className,
        )}
        {...rest}
      />
    </div>
  );
}
