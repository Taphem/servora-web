"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id?: string;
  label: string;
  helperText?: string;
  errorText?: string;
}

/** Input primitive doesn't have a built-in reveal toggle, so this wraps it with one rather than duplicating its styles. */
export function PasswordField({
  label,
  helperText,
  errorText,
  id,
  className,
  disabled,
  ...rest
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedById = errorText || helperText ? `${inputId}-hint` : undefined;
  const hasError = Boolean(errorText);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedById}
          autoComplete={rest.autoComplete ?? "current-password"}
          className={cn(
            "h-11 w-full rounded-md border bg-surface-raised px-4 pr-11 text-sm text-ink-900 placeholder:text-text-tertiary transition-colors duration-[var(--duration-fast)]",
            "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-ink-50 disabled:text-text-tertiary",
            hasError
              ? "border-error focus:border-error"
              : "border-border-default hover:border-border-strong focus:border-primary",
            className,
          )}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 disabled:pointer-events-none"
        >
          {visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {errorText ? (
        <p id={describedById} className="text-xs text-error">
          {errorText}
        </p>
      ) : helperText ? (
        <p id={describedById} className="text-xs text-text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
