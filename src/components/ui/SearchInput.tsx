"use client";

import { useId, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "onChange"> {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * Single-field search primitive — icon, clear button and loading state.
 * The Hero's multi-field search bar composes its own layout and doesn't
 * use this; this is the generic building block for search elsewhere
 * (a directory page, a modal, etc).
 */
export function SearchInput({
  id,
  label,
  value,
  onChange,
  onClear,
  loading = false,
  placeholder = "Search…",
  className,
  ...rest
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "flex h-11 items-center gap-2.5 rounded-full border border-border-default bg-surface-raised px-4 transition-colors duration-[var(--duration-fast)] focus-within:border-primary hover:border-border-strong",
          className,
        )}
      >
        <Search size={16} className="shrink-0 text-text-tertiary" aria-hidden />
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              e.preventDefault();
              onClear?.();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 placeholder:text-text-tertiary focus:outline-none"
          {...rest}
        />
        {loading ? (
          <Spinner size={14} className="shrink-0 text-text-tertiary" />
        ) : value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="flex shrink-0 items-center justify-center rounded-full p-0.5 text-text-tertiary transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={14} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
