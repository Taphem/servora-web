/**
 * Central place the app's brand assets are pointed at. Everything here
 * resolves to a local file in `public/brand/` today. When brand assets
 * move to object storage / a CDN, only the values below need to change —
 * swap a path for a full URL (e.g. "https://cdn.servora.com/brand/logo-mark.svg")
 * and update `images.remotePatterns` in next.config.ts to allow that host;
 * every component reading these constants keeps working unmodified.
 */
export const brandAssets = {
  /** Bare mark for use on light surfaces (navbar, footer-on-light, print). */
  logoMark: "/brand/logo-mark.svg",
  /** Bare mark tuned to stay legible on dark surfaces. */
  logoMarkInverse: "/brand/logo-mark-inverse.svg",
  /** Mark on its rounded-square brand chip — app icons, social/share tiles. */
  logoIcon: "/brand/logo-icon.svg",
} as const;
