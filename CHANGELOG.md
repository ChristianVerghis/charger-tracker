# Changelog

All notable user-facing changes to charger-tracker are recorded here. Internal
refactors and tooling-only changes go in the [build log of the planning vault](../EV-Network/build_log.md);
this file is for things a user (or a curious recruiter) would care about.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/),
without the date column on `[Unreleased]` since the deploy isn't live yet.

## [Unreleased]

### Added
- Native share button (`navigator.share()` on mobile = real iMessage / Mail
  / WhatsApp / Slack share sheet; clipboard fallback on desktop). Replaces
  the previous Copy-link-only button on the station detail header.
- Web App Manifest (`app/manifest.ts`) + Apple touch icon (`app/apple-icon.tsx`)
  for iOS / Android "Add to Home Screen." Theme colour matches the app's
  slate-950 background.
- App-level error boundary (`app/error.tsx`) — Next.js per-route error catch
  for server-component throws and metadata failures, complementing the
  React-tree ErrorBoundary already in place. Shows the Vercel `digest` ref
  for support and a `reset()` retry that re-renders without a hard reload.
- Site-level JSON-LD on the home page (`schema.org/WebSite` + `Organization`
  + `SearchAction`) for Google sitelinks search box; compounds with the
  per-station `EVChargingStation` schema.
- Vercel Speed Insights + Analytics in the root layout. Real Web Vitals
  (LCP/CLS/INP) and traffic data once the URL goes public.
- Dependabot config for npm + GitHub Actions (weekly, grouped). Auto-PRs
  for security advisories so the next CVE surfaces as a PR not a deploy
  rejection.
- `CONTRIBUTING.md` (local setup, standards, what kinds of PRs are welcome)
  and `SECURITY.md` (vulnerability reporting via GitHub private advisory).
- Per-station route `/station/[id]` with dynamic Open Graph cards showing the
  station name, max kW, network, and DC connector summary.
- "Top fast charger near you" callout in the empty state of the detail panel
  when geolocation is granted (and your EV's connector is compatible).
- Recently-viewed stations list (last 5) backed by localStorage.
- "Last verified N days ago" data-freshness indicator pulled from OCM's
  `DateLastVerified` field. Honest hedge — not a real-time status guarantee.
- "Open in Maps" deep link (Google Maps universal URL).
- "View on Open Charge Map" link to the source record (per-record CC-BY-SA
  attribution + lets users report bad data upstream).
- Search input on the list view (substring match across station name, town,
  address, and network).
- "Near me" geolocation button in the controls bar — adds a user-location
  marker to the map and re-sorts the list view by distance.
- "Compatible with my EV" filter chip (5th chip; only enabled when a vehicle
  is picked) — uses CCS1 ↔ J3400 adapter logic, CHAdeMO isolated.
- Map / list view toggle.
- URL permalinks (`?ev=…&filter=…&view=…&station=…`) — share-links reproduce
  the full view.
- "Copy link" button in the station detail header (with clipboard-API
  fallback for older browsers / iOS in-app webviews).
- About dialog explaining what this is, the data sources, and what's
  deliberately not in v1.
- Branded 404 page for unknown routes.
- 42 EVs in the seed (Tesla family, Hyundai/Kia/Genesis E-GMP, Ford,
  GM Ultium, VW MEB, BMW, Polestar, Volvo, Mercedes, Rivian, Lucid, Nissan,
  Toyota/Subaru, Porsche, Lexus, Mini, plus pickups and luxury sedans).
- JSON-LD `schema.org/EVChargingStation` structured data on every station
  page (Google reads this for rich search results).
- Sitemap (1,800+ stations) and robots.txt.
- Error boundary so a thrown exception in a client component shows a friendly
  fallback rather than a blank page.

### Performance
- `<link rel="preload">` for the snapshot JSON in the document `<head>` so
  the browser starts the 400 KB download during JS parse.
- MapLibre is code-split via `next/dynamic`; the initial JS download no
  longer blocks on the map library.

### Infrastructure
- GitHub Actions CI: typecheck + tests + build on push and PR.
- Snapshot diff CLI (`pnpm diff:snapshots`) for spotting OCM data drift.
- Slimmed-snapshot pipeline: 1.6 MB OCM payload → ~400 KB shipped JSON.

### Tests
- 37 vitest cases covering charge-time math, connector compatibility,
  filter logic, and the OCM → DB mappers.

## [0.1.0] — first deployable build

The build log in the planning vault has the full prose history. This entry
exists for the initial Git commit's sake — the project was scaffolded
2026-04-29 (spec) and the first end-to-end build (Next.js + EV-aware
filtering + map) shipped 2026-05-06.
