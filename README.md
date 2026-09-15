# charger-tracker

**One map of every public EV charger in Hamilton and the GTA, filtered by whether it works for your car and how long a charge will take.**

## What it is

A Next.js web app over an Open Charge Map (OCM) snapshot of 1,813 charging
stations inside a Hamilton + GTA bounding box (Stoney Creek/Burlington to
Markham/Vaughan). MapLibre map and list views share one filter state; pick your
EV from 42 seeded models and the map narrows to chargers you can actually plug
into, with an estimated charge time for any starting state of charge.

Built so far:

- **Filters:** All, DCFC only, >=150 kW, Hamilton, and "Works for my EV".
  Compatibility treats CCS1 and J3400 (NACS) as bridgeable by adapter and
  CHAdeMO as isolated. The compat chip only counts DC connectors, since almost
  every EV takes J1772 Level 2.
- **Charge-time estimate:** linear scaling off the vehicle's published 10-80%
  time, limited by the lower of charger and vehicle peak kW, target capped at
  80% (the taper above that is not modelled). Range added uses a flat
  0.18 kWh/km.
- **Station pages** at `/station/[id]` with a dynamic Open Graph card,
  `schema.org/EVChargingStation` JSON-LD, "Open in Maps" deep link, native
  share sheet (clipboard fallback), a link back to the OCM source record, and
  an "OCM verified N days ago" freshness hint from OCM's `DateLastVerified`.
- **Explorer UX:** search across name/town/address/network, "Near me"
  geolocation with distance sort, a "top fast charger near you" callout when
  your EV is compatible, last-5 recently viewed (localStorage), and URL
  permalinks (`?ev=&filter=&view=&station=`) that reproduce the full view.
- **Site plumbing:** sitemap (1,800+ URLs), robots, custom 404, web manifest
  and Apple touch icon, route-level and React-tree error boundaries, site
  JSON-LD, Vercel Analytics and Speed Insights.
- **Pipeline:** OCM ingest (Zod-validated) to timestamped raw snapshots, a
  slimming step that ships ~400 KB of JSON to the browser, a snapshot diff
  CLI, and a Supabase upsert path that mirrors the same data into Postgres.

### Spec at a glance

**Goals.** One view of the dataset most Ontario chargers already publish, with
the EV-specific question ("will this work for my car, and how long will it
take?") answered up front. Bounded to Hamilton + GTA. Honest about freshness:
the app never presents OCM metadata as live availability. Free tiers only
(Vercel, Supabase, OCM, OpenStreetMap tiles).

**Data model** (`db/migrations/0001_initial_schema.sql`):

| Table | What it holds |
| --- | --- |
| `networks` | Operator slug, name, brand colour, `ocm_operator_id` cross-ref (seeded in `0002`) |
| `stations` | One physical site: OCM POI id, address, lat/lng plus a generated PostGIS `geography` column, JSONB metadata |
| `connectors` | Individual plugs: `connector_type` enum (CCS1, J3400, CHAdeMO, J1772, ...), AC/DC, max kW, quantity |
| `status_probes` | Time series of `(connector_id, ts, status, source)`; status is AVAILABLE / IN_USE / OUT_OF_SERVICE / UNKNOWN |
| `ev_models` | Usable kWh, peak DCFC kW, inlet connector, 10-80% minutes per vehicle |
| `connector_reliability` (materialized view) | 7-day and 30-day reliability per connector, refreshed by `refresh_connector_reliability()` |

Row-level security allows anonymous reads on every table; writes go through
the service-role key in server-side scripts only.

**What "reliability" means here.** For a connector, reliability over a window
is the share of non-UNKNOWN probes in which it was AVAILABLE or IN_USE, i.e.
not OUT_OF_SERVICE. It is a property of observed status over time, not of OCM
metadata. Probes need live-status feeds from the networks, which v1 does not
have, so the schema exists but the view is empty. Until then the only
freshness signal in the UI is OCM's human "last verified" date, shown with
that caveat.

## Why I built it

Public EV charging in Hamilton and the GTA is listed across a half-dozen
network apps and aggregators, each with its own conventions, and none of them
tracks whether a given charger is dependably working. Drivers end up switching
apps mid-trip and learning reliability by anecdote. Open Charge Map already
holds the metadata for most of these sites; this project puts it on one map,
adds the vehicle-specific compatibility and charge-time layer that the
aggregators leave out, and lays down the schema needed to start measuring
uptime once status data is available.

## Status

As of 2026-09-15:

**Done**

- v1 feature-complete locally: everything listed under "What it is" runs from
  the committed snapshot with no credentials.
- 37 Vitest cases covering charge-time math, connector compatibility, filter
  logic, EV model loading, and the OCM-to-DB mappers.
- GitHub Actions CI (typecheck, tests, build) and Dependabot for npm and
  Actions; on Next 16 / React 19 / TypeScript 6.
- Snapshot last refreshed May 2026.

**Rough or not done**

- Supabase schema is written but no database is provisioned. The app reads
  the static snapshot, not Postgres. `seed:ev-models` and `upsert:ocm` work
  against a Supabase project you supply.
- No status probes, so no reliability scores. Live status is on the roadmap
  (`GOALS.md`, v1.2) and depends on network APIs or partnerships.
- Not deployed to a public URL yet.
- EV specs in `data/ev_models.csv` are approximate (manufacturer claims and
  third-party tests); expect roughly +/-10% on charge-time estimates.
- React components are untested; only pure logic has unit tests.
- `prototype/` is the pre-Next.js static map, kept for reference.

## Stack

- Next.js 16 (App Router), React 19, TypeScript 6, Tailwind CSS 4
- MapLibre GL 4 over OpenStreetMap raster tiles (code-split via `next/dynamic`)
- TanStack Query, Zod
- Supabase (`@supabase/supabase-js`) with PostGIS; schema in `db/migrations/`
- Vitest; `tsx` for CLI scripts; pnpm
- GitHub Actions CI, Dependabot, Vercel Analytics and Speed Insights

## Run it

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:3000
```

The app itself needs no environment variables: it reads the committed
`public/data/snapshot.json`. The variables in `.env.example` are only for the
data scripts:

| Variable | Needed by |
| --- | --- |
| `OCM_API_KEY` | `pnpm ingest:ocm`, `pnpm fetch:ocm-reference` (free key from the OCM developer profile) |
| `SUPABASE_URL` | `pnpm seed:ev-models`, `pnpm upsert:ocm` |
| `SUPABASE_ANON_KEY` | anonymous, RLS-bound client (`src/db/client.ts`) |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only; bypasses RLS for the write scripts. Never ship to the browser |

Apply `db/migrations/*.sql` in order through the Supabase SQL editor before
running the Supabase scripts.

```bash
pnpm dev                 # Next.js dev server on :3000
pnpm build && pnpm start # production build

pnpm ingest:ocm          # fetch Hamilton+GTA POIs from OCM -> data/snapshots/ (gitignored)
pnpm prepare:web         # slim latest snapshot -> public/data/snapshot.json (committed)
pnpm diff:snapshots      # compare the two most recent raw snapshots
pnpm fetch:ocm-reference # refresh data/ocm-reference.json
pnpm seed:ev-models      # push data/ev_models.csv to Supabase
pnpm upsert:ocm          # upsert latest snapshot into stations + connectors
pnpm dev:prototype       # build + serve the static prototype on :5173

pnpm typecheck           # tsc --noEmit
pnpm test                # vitest run
pnpm check               # typecheck + test
```

## Data

- `public/data/snapshot.json` (committed, ~400 KB): the slimmed OCM snapshot
  the web app reads. 1,813 stations with id, operator, address, coordinates,
  connectors (type, current, kW, quantity) and last-verified date. Regenerate
  with `pnpm ingest:ocm && pnpm prepare:web`.
- `data/ocm-reference.json` (committed): Open Charge Map reference export from
  the `/v3/referencedata` endpoint: connection types, operators, status types,
  current types, countries and similar lookup tables. The connection-type,
  current-type, status and operator ID mappings in `src/ingest/mappers.ts` and
  `src/lib/snapshot-types.ts` are derived from it. It embeds per-provider
  `License` fields for OCM's upstream sources; OCM's own dataset is published
  under CC-BY-SA 4.0 and the app attributes it in the footer and on every
  station panel.
- `data/ev_models.csv` (committed): 42 EVs with usable battery kWh, peak DCFC
  kW, inlet connector and 10-80% time. Sources and caveats in `data/NOTES.md`.
- Map tiles: OpenStreetMap, attributed in the footer.

## Layout

```
src/app/              # Next.js App Router pages, metadata routes, OG images
src/app/_components/  # ChargerExplorer (state owner), ChargerMap, ChargerList,
                      # TopControls, StationDetail, AboutDialog, Footer, ErrorBoundary
src/lib/              # Browser-safe helpers: snapshot types, filters, geo, EV data,
                      # recently-viewed, server-side snapshot loader
src/ev/               # EV-insight core: charge-time math, connector compatibility, models
src/db/               # Supabase clients + row types
src/ingest/           # OCM -> DB mappers
scripts/              # CLI scripts (tsx): ingest, slim, diff, seed, upsert, reference fetch
db/migrations/        # SQL migrations for Supabase
data/                 # ev_models.csv, ocm-reference.json, NOTES.md; snapshots/ is gitignored
public/data/          # Slimmed snapshot served to the browser
prototype/            # Pre-Next.js static map prototype
tests/                # Vitest suites
.github/              # CI workflow, Dependabot
```

## License

MIT. See `LICENSE`.

The source code is MIT-licensed. The charger metadata shipped in
`public/data/snapshot.json` and `data/ocm-reference.json` is derived from
Open Charge Map and remains under OCM's CC-BY-SA 4.0 terms.
