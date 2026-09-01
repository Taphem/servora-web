"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { Search, MapPin, CalendarClock, Sparkles } from "lucide-react";
import { searchSuggestions } from "@/data/search-suggestions";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [when, setWhen] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const { showToast } = useToast();
  const listId = useId();

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return searchSuggestions.slice(0, 5);
    return searchSuggestions.filter((s) =>
      s.label.toLowerCase().includes(query.trim().toLowerCase()),
    );
  }, [query]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSuggestionsOpen(false);
    showToast("Search isn't live yet — you're seeing a preview.");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full rounded-xl border border-border-default bg-surface-raised p-2 shadow-md sm:rounded-full sm:p-2.5"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0 sm:divide-x sm:divide-border-subtle">
        <div className="relative flex flex-1 items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-ink-50 sm:rounded-l-full">
          <Sparkles size={18} className="shrink-0 text-brand-600" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col">
            <label htmlFor="hero-what" className="text-[0.7rem] font-medium uppercase tracking-wide text-text-tertiary">
              What do you need help with?
            </label>
            <input
              id="hero-what"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setSuggestionsOpen(false), 120)}
              placeholder="AC repair, home cleaning, electrician…"
              role="combobox"
              aria-expanded={suggestionsOpen}
              aria-controls={listId}
              autoComplete="off"
              className="w-full truncate bg-transparent text-sm text-ink-900 placeholder:text-text-tertiary focus:outline-none"
            />
          </div>

          {suggestionsOpen && filteredSuggestions.length > 0 ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute left-0 right-0 top-full z-[var(--z-raised)] mt-2 overflow-hidden rounded-lg border border-border-default bg-surface-raised py-1.5 shadow-lg"
            >
              {filteredSuggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={query === s.label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setQuery(s.label);
                      setSuggestionsOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink-800 hover:bg-brand-50"
                  >
                    <Search size={14} className="text-text-tertiary" aria-hidden />
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50">
          <MapPin size={18} className="shrink-0 text-brand-600" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col">
            <label htmlFor="hero-where" className="text-[0.7rem] font-medium uppercase tracking-wide text-text-tertiary">
              Where?
            </label>
            <input
              id="hero-where"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Your area or pin code"
              className="w-full truncate bg-transparent text-sm text-ink-900 placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50">
          <CalendarClock size={18} className="shrink-0 text-brand-600" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col">
            <label htmlFor="hero-when" className="text-[0.7rem] font-medium uppercase tracking-wide text-text-tertiary">
              When?
            </label>
            <input
              id="hero-when"
              type="text"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              placeholder="Today, tomorrow…"
              className="w-full truncate bg-transparent text-sm text-ink-900 placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-[var(--duration-base)] ease-[var(--ease-out-premium)] hover:bg-brand-800 active:scale-[0.98] sm:ml-1",
          )}
        >
          <Search size={16} aria-hidden />
          Find a service
        </button>
      </div>
    </form>
  );
}
