# Charger Tracker — Capabilities

Hamilton/GTA EV charger reliability and insight tracker. Next.js 16 web app backed by Open Charge Map data, with EV-aware compatibility filters and a per-station detail view.

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19, Tailwind 4, TypeScript 6
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

## Status (as of 2026-09-15)

- v1 feature-complete locally; the app runs entirely from the committed snapshot (`public/data/snapshot.json`). See `README.md` for the spec summary and `GOALS.md` for the roadmap.
- Supabase schema (`db/migrations/`) is written but the database is not provisioned; the `status_probes` table and `connector_reliability` view have no data source yet.
- Not deployed to a public URL; runs locally via `pnpm dev`.

## What this codebase is NOT

- Not a real-time live-status feed — v1 ships static OCM snapshots; live status is on the v1.2 roadmap.
- Not a reliability score yet — the schema for one exists, the probes that would feed it do not.
