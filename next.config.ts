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

// The independently deployed servora-services-web app, reverse-proxied
// under /services so it appears to live on the primary domain. This is
// deployment/infrastructure wiring, not application config — deliberately
// NOT read from NEXT_PUBLIC_SITE_URL (that's the primary app's own public
// origin, a different thing) and deliberately not a new env var: it's a
// fixed rewrite destination, not something that varies per environment
// the way API base URLs do. Keep it isolated to this file — no component
// should ever hardcode or import it.
const SERVICES_APP_ORIGIN = "https://servora-services-web.vercel.app";

// Same architecture as SERVICES_APP_ORIGIN above, for the independently
// deployed Provider Web app (mounted at /provider, NEXT_PUBLIC_BASE_PATH
// set to match on its own side). Not read from NEXT_PUBLIC_SITE_URL, not
// a new env var — see the comment above for why.
const PROVIDER_APP_ORIGIN = "https://servora-provider-web-sandy.vercel.app";

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

  async rewrites() {
    return {
      // beforeFiles: matched before this app's own pages/public files are
      // checked, so /services and /provider always reach their own
      // deployments regardless of anything this repo does or doesn't
      // have at those paths — the intent ("this prefix belongs to
      // another app") stays unambiguous even as this repo grows. Every
      // other route in this app (/, /verify-email, /_next/*, etc.) is
      // untouched: none of them match a "/services..." or "/provider..."
      // source, so they fall through to this app's normal routing
      // exactly as before.
      beforeFiles: [
        {
          // The services app is served with assetPrefix: "/services", so
          // its own Next.js static assets already request
          // /services/_next/... — the wildcard rule below proxies those
          // the same way it proxies any other /services/* path. No
          // separate /_next/* rule is added or needed, and bare /_next/*
          // (this app's own assets) is never touched by either rule.
          source: "/services",
          destination: `${SERVICES_APP_ORIGIN}/services`,
        },
        {
          source: "/services/:path*",
          destination: `${SERVICES_APP_ORIGIN}/services/:path*`,
        },
        {
          // Provider Web, same reasoning as the /services rules above:
          // it's served with NEXT_PUBLIC_BASE_PATH=/provider, so its own
          // Next.js static assets already request /provider/_next/... —
          // the wildcard rule proxies those along with everything else
          // under /provider, with no separate /_next/* rule needed and
          // no effect on this app's own bare /_next/* assets.
          source: "/provider",
          destination: `${PROVIDER_APP_ORIGIN}/provider`,
        },
        {
          source: "/provider/:path*",
          destination: `${PROVIDER_APP_ORIGIN}/provider/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
