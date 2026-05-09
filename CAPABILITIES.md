# Charger Tracker — Capabilities

Hamilton/GTA EV charger reliability and insight tracker. Next.js 15 web app backed by Open Charge Map data, with EV-aware compatibility filters and a per-station detail view.

## Stack

- **Frontend:** Next.js 15 (App Router) + React 19, Tailwind 4, TypeScript 5
- **Map:** MapLibre GL (`maplibre-gl`)
- **State / data:** TanStack Query, Zod for validation
- **Persistence (planned):** Supabase (`@supabase/supabase-js` already a dep)
- **Tests:** Vitest

## Pages

- `/` — main charger explorer (interactive map + list view)
- `/station/[id]` — per-station detail page with OG image
- `sitemap.ts` / `robots.ts` — generated automatically
- `not-found.tsx` — custom 404
- Dynamic OG image at `opengraph-image.tsx` for social shares

## Component map (`src/app/_components/`)

The app is composed around an Explorer that owns filter + selection state, with separate Map, List, and TopControls components. State is lifted so EV-compatibility filters apply across map markers and list rows uniformly.

## Data ingestion

`scripts/` (TypeScript, run via `tsx`):

- `ingest-ocm.ts` — main fetch from Open Charge Map (Hamilton + GTA bounding box)
- `fetch-ocm-reference.ts` — pulls reference taxonomy (connector types, etc.)
- `upsert-from-ocm.ts` — writes/updates the data layer
- `seed-ev-models.ts` — populates EV model database
- `prepare-prototype.ts` / `prepare-web-snapshot.ts` — build snapshots for the static prototype
- `diff-snapshots.ts` — compare snapshots run-to-run for stability

## Scripts (npm/pnpm)

```bash
pnpm dev            # next dev (port 3000)
pnpm build          # next build
pnpm test           # vitest run
pnpm typecheck      # tsc --noEmit (no emit)
pnpm ingest:ocm     # fetch fresh OCM data
pnpm dev:prototype  # build + serve the static prototype on :5173
```

## Status (as of 2026-05-08)

- v1 feature-complete locally — see EV-Network/02_credibility_builds/project_01_charger_tracker/ for the canonical spec, decisions log, and v1+ roadmap.
- 8+ commits ahead of any remote (no GitHub push yet).
- Awaiting: first push, Vercel deploy, .ca domain registration, Supabase provisioning, outreach send.

## What this codebase is NOT

- Not the planning / strategy / outreach repo — that's `EV-Network`.
- Not a real-time live-status feed — v1 ships static OCM snapshots; live status is on the v1.2 roadmap.
- Not deployed yet — runs locally via `pnpm dev`.
