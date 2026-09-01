import type { NextConfig } from "next";

// `output: "standalone"` produces a self-contained `.next/standalone`
// build (app + only the node_modules it actually needs) — exactly what
// the Dockerfile's runtime stage copies in, so the image doesn't have to
// ship the full node_modules tree. It must NOT be set for Vercel builds:
// Vercel's own build pipeline does its own output tracing and post-build
// processing, which standalone mode's restructured output is incompatible
// with (it fails after static generation with
// `ENOENT: .next/next-server.js.nft.json` — a file the standard build
// produces but standalone mode doesn't). Rather than sniff Vercel's own
// `VERCEL`/`VERCEL_ENV` variables (fragile — Vercel could change how it
// signals this), the Dockerfile explicitly opts in with its own
// `BUILD_STANDALONE=true`. Any other build (Vercel included) gets the
// standard Next.js output.
const useStandaloneOutput = process.env.BUILD_STANDALONE === "true";

const nextConfig: NextConfig = {
  ...(useStandaloneOutput ? { output: "standalone" as const } : {}),

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
