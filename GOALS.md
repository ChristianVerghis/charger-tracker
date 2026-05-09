# Charger Tracker — running goals

## v1 build (mostly done)

- [x] Next.js scaffold with App Router, TypeScript, Tailwind 4
- [x] MapLibre integration with charger markers
- [x] OCM ingestion pipeline (`ingest-ocm.ts`, `upsert-from-ocm.ts`)
- [x] EV models data + selector + compatibility filter
- [x] List view with search, list-and-map both honor filter state
- [x] Per-station detail route (`/station/[id]`)
- [x] OG image generation, sitemap, robots, custom 404
- [x] Dynamic permalink URLs (filter state encoded)
- [x] Vitest suite — 37+ passing tests
- [x] Static prototype build (`pnpm dev:prototype`)
- [x] First-impression polish (About, footer, icon, open-in-maps)

## v1 ship

- [ ] **First push to GitHub** (private during build, public on launch)
- [ ] Vercel deploy
- [ ] `.ca` domain registered + DNS pointed
- [ ] Outreach emails sent (SWTCH, Flo, ChargeLab, Ivy via OVIN)
- [ ] LinkedIn / r/electricvehicles announcement
- [ ] First 100 page views

## v1.1 — Supabase

- [ ] Supabase project provisioned (free tier)
- [ ] OCM snapshots persisted server-side (cron-refreshed)
- [ ] Per-user reports table (anonymous → email later)
- [ ] First reliability report submitted via the UI

## v1.2 — selective live status

- [ ] Identify networks with public live-status APIs (Tesla, Flo, ChargePoint?)
- [ ] Adapter pattern per network
- [ ] "Available now" filter

## v1.5 — community + planning

- [ ] Per-station crowdsourced reports (not just flag, structured)
- [ ] Trip planner (start, end, range, charging stops)
- [ ] Above-80% modelling (charging speed slowdown)

## v2 — rest of Ontario

- [ ] Expand bounding box beyond Hamilton/GTA
- [ ] Multi-region browsing
