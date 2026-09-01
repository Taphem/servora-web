# Servora Web

**This repository is the standalone customer-facing web application for
Servora** — a service for finding, comparing and booking local
professionals. It owns one thing: the browser-facing frontend a customer
visits at `servora.hemandu.com`.

## What this repository is — and isn't

This is a **standalone frontend application**, not a monorepo and not a
full-stack project. It contains no backend, no database, and no payment
integration of its own — those live in Servora's other repositories and are
reached only as **external systems, over documented HTTP APIs**, never by
assuming another service's source code, database, or internals exist
locally.

This app talks to the real backend for exactly one thing today:
**authentication** (`src/lib/auth`), through the deployed API Gateway. Every
other feature — marketplace browsing, provider cards, booking, search — is
still typed mock data checked into this repo (`src/data`), read through a
separate, deliberately-mock service-layer abstraction (`src/lib/api`) shaped
like the eventual real API. The two layers are kept apart on purpose: `src/lib/api`
returns fixtures and always will until a Booking/Search/etc. service exists to
call; `src/lib/auth` makes real network requests against a real, deployed
service today. See [Authentication](#authentication) and
[Future API boundary](#future-api-boundary) below.

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

- **Node.js 24** (LTS) — the version this repo has standardized on, kept
  aligned everywhere it matters: [`.nvmrc`](.nvmrc), `package.json`'s
  `engines.node` (`24.x`), the `Dockerfile`'s base image, GitHub Actions,
  and Vercel's Node.js version project setting (which reads `engines.node`).
  With [nvm](https://github.com/nvm-sh/nvm): `nvm use`.
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
npm run test         # Vitest, single run
npm run test:watch    # Vitest, watch mode
npm run build          # production build
npm run start            # serve the production build (run build first)
```

## Environment variables

See [`.env.example`](.env.example) for the full documented list. Copy it to
`.env.local` to override anything locally:

```bash
cp .env.example .env.local
```

Every variable has a safe default (`src/lib/env.ts`), including
`NEXT_PUBLIC_API_BASE_URL`, which defaults to the real deployed API Gateway
(`https://servora-api-gateway.onrender.com`) — so **the app runs with zero
configuration** and, unlike the mock marketplace data, its auth calls reach a
real backend even in local dev. Only `NEXT_PUBLIC_`-prefixed variables belong
in this file; Next.js inlines those into the browser bundle at build time, so
nothing secret can ever go behind that prefix. `.env`, `.env.local` and
friends are gitignored and must never be committed — only `.env.example` is
tracked.

Note for local development: the Gateway's CORS allow-list is configured for
the production frontend origin, not `http://localhost:3000`, so auth requests
made from a local dev server will fail with a CORS error in the browser
console (visible as the app's own "Couldn't reach the server" state, not a
crash) until the Gateway's `CORS_ALLOWED_ORIGINS` includes your local origin.
This is an operational config concern in `servora-api-gateway`, not something
fixable from this repo.

## Production build

```bash
npm run build
npm run start
```

This is the standard Next.js build — the one Vercel also runs. `npm run
start` serves it directly.

Next.js also supports `output: "standalone"`, which produces a
self-contained `.next/standalone/server.js` bundling only the
`node_modules` the app actually uses at runtime. That mode is **not** the
default here: Vercel's build pipeline does its own output tracing and
post-build processing, and enabling standalone output unconditionally
breaks it (`ENOENT: .next/next-server.js.nft.json` after an otherwise
successful build — standalone mode restructures the output in a way
Vercel's post-build step doesn't expect).

`next.config.ts` only enables `output: "standalone"` when
`BUILD_STANDALONE=true` is set at build time — nothing sets that except the
Dockerfile, so `npm run build` here and on Vercel both produce the regular
build, and Docker builds (below) opt into standalone explicitly.

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

In practice, this app is currently also deployed on Render
(`https://servora-web.onrender.com`), outside of this planned path — that
deployment isn't described by anything in this repo (no `render.yaml`), so
treat it as configured directly in the Render dashboard. Worth noting for
`/verify-email` and `/reset-password` specifically: both are ordinary
Next.js App Router pages, prerendered to real static HTML at build time (see
the `○ (Static)` output of `next build`) — not client-only routes bolted on
top of a single-page app — so a Node/Next-based Render service serves a
direct navigation to either URL (with or without a `?token=`) correctly with
no SPA catch-all rewrite required.

## Authentication

```
Browser (this repo) → servora-api-gateway → servora-auth
```

This frontend never calls `servora-auth` directly, and never invents an
endpoint — every call in `src/lib/auth/api.ts` was verified against
`servora-auth`'s actual route/schema source before being written. All auth
traffic goes through the deployed Gateway at `NEXT_PUBLIC_API_BASE_URL`
(default `https://servora-api-gateway.onrender.com`), under the fixed prefix
`/api/v1/auth/*`.

### Session model

Sessions are an **opaque, `httpOnly` cookie** (`servora_session`) set by
`servora-auth` and forwarded verbatim by the Gateway — **not** a JWT. The
browser cannot read, decode, or store it itself; every request that needs to
know "am I logged in" calls `GET /api/v1/auth/session` with
`credentials: "include"` and reads the answer from the response body.
`src/lib/auth/AuthProvider.tsx` wraps this in a `useAuth()` context
(`user`, `status`, `refresh()`, `setUser()`, `signOut()`) that the whole app
reads from — most visibly the Navbar, which shows Log in/Get started or the
signed-in email/Log out depending on `status`.

### Endpoints used

| Flow | Endpoint | Notes |
| --- | --- | --- |
| Register | `POST /api/v1/auth/register` | Body: `{ email, password }` only — no name/phone/role field exists server-side. **Logs the user in immediately** (sets the session cookie) even though `emailVerified` starts `false`. |
| Login | `POST /api/v1/auth/login` | Body: `{ email, password }`. The backend does **not** block login for an unverified account — `emailVerified` in the response is just a signal the UI uses to nudge the user, not a gate. |
| Logout | `POST /api/v1/auth/logout` | No body, `204`. |
| Session check | `GET /api/v1/auth/session` | Always `200`; the body's `authenticated` field is the discriminant. |
| Verify email | `POST /api/v1/auth/email/verify` | Body: `{ token }` — the token travels in the JSON body, never a query/path param at the API level. |
| Resend verification | `POST /api/v1/auth/email/resend` | Body: `{ email }`. Always returns the same generic message (account-enumeration-safe by design). |
| Request password reset | `POST /api/v1/auth/password/reset/request` | Body: `{ email }`. Same enumeration-safe pattern as resend. |
| Confirm password reset | `POST /api/v1/auth/password/reset/confirm` | Body: `{ token, newPassword }`. **Revokes every existing session** for that account — the UI treats the caller as logged out afterward and routes to login, never assuming continued auth. |

`/email/verify` and `/password/reset/confirm` both collapse "invalid",
"expired", and "already used" into one generic `400 TOKEN_INVALID` — the
backend does not distinguish those cases, so this UI doesn't invent a
distinction either; there is exactly one "this link is invalid or expired"
state for each flow, not three.

### The auth UI

`src/components/auth/` holds a single shared modal (`AuthModalProvider` /
`AuthModal`), opened from anywhere via `useAuthModal().openLogin()` /
`openSignup()`, that switches between `LoginForm`, `SignupForm`, and
`ForgotPasswordForm` without closing — "Don't have an account? Sign up" and
"Already have an account? Log in" swap the mode in place. It's focus-trapped,
closes on Escape or a backdrop click (via the existing `Modal` primitive),
and shows real loading/validation/error/success states rather than `alert()`
or a raw API error dump — errors go through
`src/lib/auth/errorMessages.ts`, which turns a backend error code into
human copy (falling back to the backend's own message for any code it
doesn't have bespoke copy for).

### Email verification & password reset: the token-in-URL flow

Both `servora-notification`'s verification email and the password-reset
email link to a URL carrying the token as a query parameter
(`/verify-email?token=…`, `/reset-password?token=…`) — that's a transport
necessity, not something this app can avoid. What happens the moment the
page loads (`src/components/auth/VerifyEmailView.tsx` and
`ResetPasswordView.tsx`, both mounted behind a `Suspense` boundary in
`src/app/verify-email/page.tsx` / `src/app/reset-password/page.tsx`) is:

1. The token is read **once**, from the URL present at mount.
2. `window.history.replaceState(null, "", "/verify-email")` (no reload)
   strips it from the visible address bar **immediately** — before the
   verification/reset request is even sent, and even when there's no token
   to strip (so a stray empty `?token=` doesn't linger either).
3. The token is held only in a `useRef`/local variable for the rest of the
   component's life — it is never written to `localStorage` or
   `sessionStorage`, and a `useRef` guard ensures the verify/reset request
   fires exactly once per real token, even under React's dev-mode double-effect.
4. The request goes to the Gateway over HTTPS, `credentials: "include"`,
   exactly like every other auth call.
5. Success clears to a clean state (`/verify-email` or `/reset-password`,
   no query string) and offers a "Continue to login" action. Failure shows
   the one generic invalid/expired state (with a "resend a new link" mini
   form on `/verify-email`), or a distinct, retryable "couldn't reach the
   server" state for a genuine network failure — never the token itself, in
   either case.
6. Because the URL is already clean by the time step 2 finishes, **refreshing
   the page after verifying does not re-attempt verification** — it just
   shows the same "no link found" state a direct visit with no token would.

`src/lib/auth/client.ts` (the one shared fetch layer everything above uses)
deliberately never calls `console.log`/`console.error` on any request or
response — those paths are reachable from the token-carrying flows above, so
logging there is avoided entirely rather than trying to redact after the
fact. This is covered by tests — see [Testing](#testing).

### Known backend/operational risks (not fixed here — out of scope for this repo)

Two issues were found while verifying the real contracts above, in
`servora-api-gateway` and `servora-auth`'s own source. Neither is caused by
or fixable from this repository; they're documented here so they aren't
mistaken for frontend bugs:

- **Cross-origin cookie risk**: `servora-web.onrender.com` and
  `servora-api-gateway.onrender.com` are different registrable domains (not
  subdomains of a shared parent). The session cookie's `sameSite` defaults to
  `'lax'` in `servora-auth`, which does not reliably survive a cross-site
  `fetch`/XHR with `credentials: "include"` — it needs `SameSite=None;
  Secure` for this architecture to work in production. This frontend always
  sends `credentials: "include"` correctly; whether the cookie actually
  round-trips is an environment/cookie-config concern in `servora-auth`.
- **Gateway → auth internal identity check is broken**: `servora-api-gateway`'s
  internal `/internal/v1/sessions/verify` call never sends the
  `x-servora-internal-key` header `servora-auth` requires for it, so that
  call 401s in production. It does **not** break anything this frontend uses
  (register/login/logout/verify/reset are pure passthrough proxying), but it
  does mean `request.identity`/`x-user-*` headers are never populated for
  other services behind the Gateway.

## Future API boundary

```
Browser → API Gateway → Servora services (Auth ✅ real, Booking, Payments, Search, AI, Notifications ⏳ mock)
```

Authentication (above) is the first slice of this boundary that's real.
Everything else — bookings, payments, search, the AI assistant — is still
local mock data (`src/data/`, read through `src/lib/api/`) until those
services exist to point at; wiring each one up later means replacing the
body of the matching function in `src/lib/api`, not changing components.

## Project structure

```
src/
├── app/                 # Next.js App Router entry — layout, globals.css, and pages:
│   ├── page.tsx          #   the marketplace landing page (mock data)
│   ├── verify-email/       #   email verification landing route — see "Authentication"
│   └── reset-password/      #   password reset landing route — see "Authentication"
├── components/
│   ├── ui/               # Design-system primitives — see "Design system" below
│   ├── auth/              # Auth modal, Login/Signup/ForgotPassword forms, verify/reset views
│   ├── layout/             # Navbar, Footer, smooth-scroll & anchor-scroll providers
│   ├── hero/                # Hero copy, search bar, hero visual composition
│   ├── categories/            # Popular categories grid
│   ├── providers/               # Featured provider cards + profile modal
│   ├── scroll-story/              # The cinematic scroll-linked "How it works" sequence
│   ├── ai/                          # AI assistant showcase (a scripted demo conversation)
│   ├── trust/                         # Trust section + the reusable verification badge list
│   ├── testimonials/                    # Customer reviews
│   ├── business/                          # Provider/business CTA
│   └── final-cta/                           # Closing call to action
├── data/                 # Typed mock data (categories, providers, reviews, …)
├── lib/
│   ├── api/               # Mock service layer — the ONLY place UI reads "backend" marketplace data
│   ├── auth/                # Real backend calls — types, fetch client, endpoint wrappers, AuthProvider (see "Authentication")
│   ├── env.ts                 # Centralized environment variable access (see below)
│   ├── media.ts                 # Deterministic generated art standing in for provider photos
│   └── utils.ts                   # cn() class merging (tailwind-merge, extended — see below), formatters
├── types/                # Shared domain types (Provider, booking status, roles, …)
├── hooks/                # useScrolled, usePrefersReducedMotion, useFocusTrap, …
├── animations/           # Framer Motion variants + named reveal components (FadeIn, SlideUp, …)
└── test/                 # Shared test setup (renderWithProviders) — see "Testing"
```

Nothing outside `src/components/ui` should read `src/data` directly —
everything goes through `src/lib/api`, so extending the mock marketplace
layer to a real backend later is a change in one folder, not a
search-and-replace across the app. `src/lib/auth` is intentionally kept
separate from `src/lib/api` — one talks to a real, deployed service today,
the other returns fixtures — so the two are never confused mid-migration.

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

## Testing

[Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react),
covering `src/lib/auth` and `src/components/auth` — the parts of this app
that talk to a real backend and carry the most risk if they regress:

- **Auth UI**: the shared modal opens/closes/switches between
  login/signup/forgot-password, and closes on Escape and on `close()`.
- **Sign up**: calls `register()` with exactly `{ email, password }` (never
  `confirmPassword`, which is client-only), surfaces validation errors
  (password length, mismatch) without calling the API, shows the real
  duplicate-email message on `409`, and shows the "check your email" success
  state — including resend — without implying the account is verified.
- **Login**: calls `login()` with the entered credentials, shows validation
  errors for an empty submit, shows the real "don't match" message on `401`,
  and confirms an unverified account still logs in successfully (matching
  the real backend, which never blocks on `emailVerified`).
- **Email verification & password reset**: the token is extracted from the
  URL and the URL is stripped **before** the request settles; the correct
  endpoint is called with the token in the request body; a `TOKEN_INVALID`
  response produces the one generic invalid/expired state (not separate
  expired/used states); a non-token failure produces a distinct, retryable
  network-error state; the raw token is asserted to never reach
  `console.log`/`console.error` or `localStorage`/`sessionStorage`; and a
  simulated refresh after the URL is already clean does **not** re-trigger
  verification.
- **The fetch layer** (`src/lib/auth/client.ts`): correct `credentials:
  "include"` on every call, correct parsing of both the success and
  `{ error: { code, message, requestId } }` shapes, the synthetic
  network/malformed-response client codes, and — again — that nothing is
  ever logged.

## What's intentionally not here

Per scope, this repository's marketplace side (browsing, booking, search,
payments) is still mock — authentication is the one real backend integration
so far (see [Authentication](#authentication)). This repo still contains no
database, payment processing, or live search of its own, and none of
PostgreSQL, Redis, RabbitMQ, Kubernetes, or the API Gateway's own
implementation belong here either; those are other repositories' concerns.
Interactive elements that would need a backend that doesn't exist yet
(search submission, "Request booking", "View all providers") surface an
honest in-product state — a toast or a disabled control — rather than
pretending to work. `EmptyState` and `ErrorState` exist for the same reason:
ready-made states for real API integrations to use, some already wired
(auth), most not yet.
