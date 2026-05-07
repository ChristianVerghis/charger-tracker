# charger-tracker

Hamilton/GTA EV charger reliability and insight tracker. See the canonical spec
in the planning vault (private repo `ChristianVerghis/EVProject`):
`../EV-Network/02_credibility_builds/project_01_charger_tracker/spec.md`.

## Status

Week 2 of 8 — Next.js app shell live, OCM ingestion + EV-insight core
in place, Supabase pipeline wired but not yet deployed. v1 is metadata-only;
live status integration deferred (see `data_sources.md` in the planning vault).

## Setup

```bash
pnpm install
cp .env.example .env.local
# Register a free OCM API key at https://openchargemap.org/site/profile/applications
# and paste it into .env.local
```

## Scripts

```bash
pnpm dev              # Next.js dev server on :3000
pnpm build            # Production build
pnpm start            # Run the production build

pnpm ingest:ocm       # Fetch GTA chargers from Open Charge Map; writes data/snapshots/
pnpm prepare:web      # Slim the latest snapshot to public/data/snapshot.json (the file the
                      # web app reads). Re-run after each `ingest:ocm`.
pnpm seed:ev-models   # Push data/ev_models.csv to Supabase (needs SUPABASE_* in .env.local)
pnpm upsert:ocm       # Upsert OCM POIs into stations + connectors

pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run
```

## Layout

```
src/app/              # Next.js App Router pages + components
src/app/_components/  # Map, filters, station detail (client components)
src/lib/              # Browser-safe helpers (snapshot types, EV models data)
src/ev/               # EV-insight core (charge-time, connectors, models loader)
src/db/               # Supabase client + DB row types
src/ingest/           # OCM → DB mappers
scripts/              # CLI scripts (tsx)
db/migrations/        # SQL migrations (apply via Supabase SQL editor)
data/                 # ev_models.csv (committed) and snapshots/ (gitignored)
public/data/          # Slimmed snapshot served to the web app (committed)
prototype/            # Pre-Next.js static map prototype (kept for reference)
tests/                # vitest
```

## Data flow

1. `pnpm ingest:ocm` — pulls Hamilton+GTA chargers from Open Charge Map and
   writes a timestamped snapshot to `data/snapshots/`.
2. `pnpm prepare:web` — slims the most recent snapshot down to ~340 KB and writes
   it to `public/data/snapshot.json`. Vercel serves it as a static asset.
3. The Next.js app fetches `/data/snapshot.json` and renders it on a MapLibre
   map with the EV-insight panel.

Once Supabase is provisioned, the page will read from the DB instead of the
static snapshot, and a 15-minute cron will keep the live-status table fresh.

## Deploy

Hosted on Vercel. The repo builds with `pnpm build`; no env vars needed for v1
(the snapshot is committed). Add Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`) once the DB is live.
