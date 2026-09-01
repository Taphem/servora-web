# Servora Web

**This repository is the standalone customer-facing web application for
Servora** — a service for finding, comparing and booking local
professionals. It owns one thing: the browser-facing frontend a customer
visits at `servora.hemandu.com`.

## What this repository is — and isn't

This is a **standalone frontend application**, not a monorepo and not a
full-stack project. It contains no backend, no database, no authentication
service, and no payment integration. Everything it renders today comes from
typed mock data checked into this repo (`src/data`), read through a small
service-layer abstraction (`src/lib/api`) shaped like the eventual real API.

Future Servora backend services (Auth, Booking, Payments, Search, AI,
Notifications) live in their own repositories and are reached from here only
as **external systems, over documented HTTP APIs and events** — this app
never assumes another service's source code, database, or internals exist
locally. Wiring this frontend to a real API Gateway later means replacing
the bodies of the functions in `src/lib/api`; no component should need to
change. See [Future API boundary](#future-api-boundary) below.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** (strict mode)
- **Tailwind CSS v4** — every design token is a CSS custom property in
  [`src/app/globals.css`](src/app/globals.css), exposed to Tailwind utilities
  via `@theme`
- **Framer Motion** — entrance choreography and the scroll-linked cinematic
  sections
- **Lenis** — smooth scrolling, skipped entirely for `prefers-reduced-motion`
- **lucide-react** — the app's one icon library

## Requirements

- **Node.js 24** (LTS) — see [`.nvmrc`](.nvmrc). The app itself only
  requires Next.js's own minimum (Node ≥ 20.9), but local dev, Docker and CI
  are all pinned to the same major version so nothing behaves differently
  between them. With [nvm](https://github.com/nvm-sh/nvm): `nvm use`.
- **npm** (ships with Node) — `package-lock.json` is committed, so every
  install (`npm ci`, Docker, CI) resolves the exact same dependency tree.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build        # production build
npm run start         # serve the production build (run build first)
```

## Environment variables

See [`.env.example`](.env.example) for the full documented list. Copy it to
`.env.local` to override anything locally:

```bash
cp .env.example .env.local
```

Every variable has a safe default (`src/lib/env.ts`) — **the app runs with
zero configuration**, entirely on local mock data. Only
`NEXT_PUBLIC_`-prefixed variables belong in this file; Next.js inlines those
into the browser bundle at build time, so nothing secret can ever go behind
that prefix. `.env`, `.env.local` and friends are gitignored and must never
be committed — only `.env.example` is tracked.

## Production build

```bash
npm run build
npm run start
```

`next build` (see [`next.config.ts`](next.config.ts)) is configured with
`output: "standalone"`, which produces a self-contained
`.next/standalone/server.js` bundling only the `node_modules` the app
actually uses at runtime — Vercel ignores this setting in favor of its own
bundling, so it's safe for both targets. `npm run start` serves the regular
build; the standalone server is what the Docker image below runs directly.

## Docker

A production image, built with a three-stage `Dockerfile`
(dependencies → build → runtime) on `node:24-alpine`, running the
standalone server as a non-root user (`nextjs`, uid 1001).

```bash
docker build -t servora-web .
docker run --rm -p 3000:3000 servora-web
```

Open [http://localhost:3000](http://localhost:3000). The final image ships
no source code, no dev dependencies, no lockfile, and no `.git` — see
[`.dockerignore`](.dockerignore) — just the compiled server and static
assets.

The page is fully static (prerendered at build time), and `NEXT_PUBLIC_*`
variables are inlined into the client bundle at **build time** — so
overriding `NEXT_PUBLIC_SITE_URL` means passing it as a build arg, not a
`docker run -e` flag (which would have no effect on an already-built,
static bundle):

```bash
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://staging.example.com -t servora-web .
```

Anything genuinely needed at container-start time (not build time) would
need to be a server-only, non-`NEXT_PUBLIC_` variable instead — none exist
yet.

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull
request and every push to `main`: install → lint → typecheck → build. It is
**validation only** — nothing in this workflow deploys anything, and it
holds no secrets or credentials (`permissions: contents: read`, no cloud
credentials configured).

## Deployment (planned, not yet configured)

The intended production path, once this milestone is verified, is:

```
GitHub → GitHub Actions CI → Vercel → servora.hemandu.com
```

This is **not yet wired up** — there is no deploy step in CI and no Vercel
project connected. That's a deliberate next milestone, kept separate from
this one.

## Future API boundary

```
Browser → API Gateway → Servora services (Auth, Booking, Payments, Search, AI, Notifications)
```

The planned production API origin is `https://api.servora.hemandu.com` —
documented here as intent, **not implemented or called anywhere in this
codebase**. The app remains fully functional on local mock data
(`src/data/`, read through `src/lib/api/`) until a real Gateway exists to
point it at.

## Project structure

```
src/
├── app/                 # Next.js App Router entry — layout, page, globals.css
├── components/
│   ├── ui/               # Design-system primitives — see "Design system" below
│   ├── layout/            # Navbar, Footer, smooth-scroll & anchor-scroll providers
│   ├── hero/               # Hero copy, search bar, hero visual composition
│   ├── categories/          # Popular categories grid
│   ├── providers/            # Featured provider cards + profile modal
│   ├── scroll-story/          # The cinematic scroll-linked "How it works" sequence
│   ├── ai/                     # AI assistant showcase (a scripted demo conversation)
│   ├── trust/                   # Trust section + the reusable verification badge list
│   ├── testimonials/             # Customer reviews
│   ├── business/                  # Provider/business CTA
│   └── final-cta/                  # Closing call to action
├── data/                 # Typed mock data (categories, providers, reviews, …)
├── lib/
│   ├── api/               # Mock service layer — the ONLY place UI reads "backend" data
│   ├── env.ts                # Centralized environment variable access (see below)
│   ├── media.ts             # Deterministic generated art standing in for provider photos
│   └── utils.ts               # cn() class merging (tailwind-merge, extended — see below), formatters
├── types/                # Shared domain types (Provider, booking status, roles, …)
├── hooks/                # useScrolled, usePrefersReducedMotion, useFocusTrap, …
└── animations/           # Framer Motion variants + named reveal components (FadeIn, SlideUp, …)
```

Nothing outside `src/components/ui` should read `src/data` directly —
everything goes through `src/lib/api`, so the migration to a real backend is
a change in one folder, not a search-and-replace across the app.

## Design system

### Tokens

Every color, radius, shadow, spacing and motion value used anywhere in the
app is a named CSS custom property in
[`src/app/globals.css`](src/app/globals.css), registered with Tailwind via
`@theme` so they're available as ordinary utility classes (`bg-primary`,
`text-h2`, `rounded-lg`, `shadow-md`, …). Nothing is a bare hex code inside a
component.

- **Color** — a neutral `ink` scale and a `brand` emerald-teal scale as the
  raw palette, plus semantic aliases components should actually reach for:
  `primary` / `primary-hover` / `primary-soft`, `surface` /
  `surface-elevated` / `surface-sunken`, `text-primary` / `text-secondary` /
  `text-muted`, `border-default` / `border-strong`, and `success` /
  `warning` / `error` / `info` states.
- **Typography** — [Fraunces](https://fonts.google.com/specimen/Fraunces)
  (display serif) paired with [Inter](https://fonts.google.com/specimen/Inter)
  (UI and body), loaded via `next/font` (self-hosted, no layout shift). A
  named type scale — `text-display`, `text-h1`…`text-h4`, `text-body`,
  `text-small`, `text-label`, `text-caption` — carries its own line-height,
  letter-spacing and weight, so a heading is one class instead of four.
- **Radius, shadow, spacing, motion, z-index** — each a small deliberate
  scale (see `globals.css`), not ad-hoc values scattered per component.

Base resets (`* { border-color }`, focus ring, selection color, etc.) live
inside `@layer base` rather than as unlayered CSS — Tailwind's own utilities
are generated into layers, and unlayered CSS beats every layered rule
regardless of specificity, so an unlayered reset would silently defeat any
utility trying to override it.

`cn()` (`src/lib/utils.ts`) wraps `tailwind-merge`, extended to know about
the custom type-scale names above — without that extension, `tailwind-merge`
doesn't recognize e.g. `text-h2` as a font-size utility and drops it
whenever a text-color class appears alongside it in the same call.

### Primitives

`src/components/ui` — Button (primary/secondary/tertiary/ghost/destructive/
inverse, with hover/active/focus/disabled/loading states), IconButton, Input,
SearchInput, Textarea, Select, Badge, Avatar, Rating, Card, Divider, Tooltip,
Modal, Drawer (both focus-trapped — see below), Skeleton, Spinner, Toast,
EmptyState, ErrorState, SectionHeading, Container, Section, Stack, Grid,
PageWrapper.

`Section` / `Stack` / `Grid` / `Container` / `PageWrapper` are the layout
primitives every page should compose with instead of hand-rolling
`max-width`/padding/grid values — `PageWrapper` in particular exists for any
future page that *doesn't* open with a Hero, so its content doesn't render
underneath the fixed navbar.

Form controls (`Input`, `Textarea`, `Select`) share one visual language —
default / hover / focus / disabled / error states — driven by the same
`error`/`success` props, ready for real validation once there's a backend to
validate against.

### Motion

- Named reveal patterns in `src/animations/components.tsx` —
  `FadeIn`, `SlideUp`, `ScaleIn`, `Reveal`, `Stagger` — sit on top of shared
  variants in `src/animations/variants.ts`, so no component hand-writes
  framer-motion props inline.
- Three sections go further, using **scroll-linked** (not just
  scroll-triggered) motion: the "How it works" Discover → Compare → Book →
  Done sequence, and the AI assistant conversation reveal.
- The whole app is wrapped in Framer Motion's `MotionConfig
  reducedMotion="user"`. Lenis is skipped entirely — not just slowed down —
  for anyone with `prefers-reduced-motion` set; the cinematic sections
  render their static, fully-accessible fallback instead of the pinned
  scroll sequence. Both paths render the same content.
- Modal and Drawer trap focus while open (`useFocusTrap`, in `src/hooks`):
  focus moves in on open, Tab/Shift+Tab cycle within the dialog instead of
  escaping to the page behind it, and focus returns to whatever opened it on
  close.

### Responsive

Layouts are checked at 320/375/390/430/768/1024/1280/1440/1920px. Nothing
relies on a single fixed breakpoint jump — spacing, grid column counts and
type sizes (via `clamp()`-based tokens) scale continuously between the
scales Tailwind exposes (`sm`/`md`/`lg`/`xl`).

## What's intentionally not here

Per scope, this repository does not include real authentication, a
database, payment processing, live search, or any backend service — and
none of PostgreSQL, Redis, RabbitMQ, Kubernetes, or an API Gateway belong
here either; those are other repositories' concerns. Interactive elements
that would need a backend (search submission, "Request booking", "View all
providers") surface an honest in-product state — a toast or a disabled
control — rather than pretending to work. `EmptyState` and `ErrorState`
exist for the same reason: ready-made states for real API integrations to
use later, not wired to anything yet.
