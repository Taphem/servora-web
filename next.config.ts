import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
