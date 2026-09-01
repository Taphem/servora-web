import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained `.next/standalone` build (app + only the
  // node_modules it actually needs) so the Docker image doesn't have to
  // ship the full node_modules tree. Vercel ignores this in favor of its
  // own bundling, so it's safe to leave on for both targets.
  output: "standalone",

  images: {
    // Brand assets (src/lib/brand.ts) are trusted, repo-authored SVGs —
    // this is the standard Next.js opt-in to let next/image serve them,
    // sandboxed via CSP. When brand assets move to a CDN, add that host
    // to remotePatterns here.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
