/**
 * Single place the app reads environment variables from, instead of
 * scattering `process.env.X` through components. Every value here has a
 * safe default, so the app runs correctly with zero configuration.
 *
 * Only NEXT_PUBLIC_-prefixed variables belong here — anything without
 * that prefix is server-only and must never be read from a Client
 * Component. See `.env.example` for the full documented list.
 */
export const env = {
  /** Public site origin — used for absolute URLs in metadata (Open Graph, canonical links). */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://servora.hemandu.com",

  /**
   * The public Servora API Gateway origin. The browser talks ONLY to
   * this — never to servora-auth or any other downstream service
   * directly. Defaults to the currently deployed gateway so the app
   * works against real auth with zero local configuration.
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://servora-api-gateway.onrender.com",

  /**
   * Google's OAuth 2.0 Client ID, used only to initialize Google
   * Identity Services in the browser (google.accounts.id.initialize).
   * This is a public identifier, not a secret — Google's own docs
   * describe it as safe to embed in client-side code, unlike the
   * client SECRET, which must never exist in this repo or bundle.
   * No safe non-empty default exists (unlike apiBaseUrl, there's no
   * "already deployed" Client ID to fall back to) — an empty string
   * means "not configured", and GoogleAuthButton hides itself rather
   * than initializing GIS with a blank client_id.
   */
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
} as const;
