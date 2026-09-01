/**
 * Single place the app reads environment variables from, instead of
 * scattering `process.env.X` through components. Every value here has a
 * safe default, so the app runs correctly with zero configuration.
 *
 * Only NEXT_PUBLIC_-prefixed variables belong here — anything without
 * that prefix is server-only and must never be read from a Client
 * Component. See `.env.example` for the full documented list, including
 * variables reserved for future use that nothing reads yet.
 */
export const env = {
  /** Public site origin — used for absolute URLs in metadata (Open Graph, canonical links). */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://servora.hemandu.com",
} as const;
