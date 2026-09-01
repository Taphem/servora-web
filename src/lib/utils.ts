import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a rupee amount range for provider pricing display. */
export function formatPriceRange(min: number, max: number) {
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  return `${fmt(min)} – ${fmt(max)}`;
}
