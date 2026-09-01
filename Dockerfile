# syntax=docker/dockerfile:1

# Servora Web — production container image.
#
# Three stages: install dependencies once, build the app, then copy only
# the Next.js "standalone" output (see `output: "standalone"` in
# next.config.ts) into a clean runtime image. The final image contains no
# source, no dev dependencies, and no build tooling — just the compiled
# server and the static assets it serves.
#
# Build:  docker build -t servora-web .
# Run:    docker run --rm -p 3000:3000 servora-web

ARG NODE_VERSION=24-alpine

# ---------------------------------------------------------------------------
# Stage 1 — dependencies
# Installs with `npm ci` (deterministic, uses package-lock.json exactly) in
# its own layer so it's only re-run when the lockfile actually changes.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 2 — build
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time,
# not read at container start — the page is fully static (prerendered),
# so this is the only point where they can be set. Must stay non-empty
# (matches the fallback in src/lib/env.ts) — an empty value would make
# `new URL("")` throw during the build.
ARG NEXT_PUBLIC_SITE_URL=https://servora.hemandu.com
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3 — production runtime
# Only what next.config.ts's standalone output actually needs to run:
# no node_modules copied wholesale, no source, no lockfile.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root runtime user.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
