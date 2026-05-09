# Contributing

Thanks for your interest in contributing to charger-tracker. This document is
short on purpose — the project is small, the surface area is bounded, and
anything that isn't documented here can probably be discovered by reading the
code.

## Local setup

```bash
git clone https://github.com/ChristianVerghis/charger-tracker.git
cd charger-tracker
pnpm install

cp .env.example .env.local
# Get a free OCM API key at https://openchargemap.org/site/profile/applications
# and paste it into .env.local — only needed if you're running ingest:ocm.

pnpm dev
```

The app reads from `public/data/snapshot.json` (committed) so you can develop
without OCM credentials. `pnpm ingest:ocm` + `pnpm prepare:web` regenerates
that file from a fresh OCM pull.

## Standards

- **TypeScript strict mode** is on. `noUncheckedIndexedAccess` too.
- **`pnpm typecheck` and `pnpm test` must pass** before any PR is merged. CI
  enforces this.
- **No new runtime dependencies** without a clear reason in the PR description.
  The current dep tree is small on purpose.
- **Prefer editing existing files** over creating new ones. The `src/`
  layout is `app/`, `db/`, `ev/`, `ingest/`, `lib/` — most additions belong
  in one of those.
- **Comments only when the WHY is non-obvious.** Don't restate code.
- **Tests live in `tests/`** as `*.test.ts`. Pure functions get unit tests;
  React components are intentionally untested for v1 (see the build log in
  the planning vault for the reasoning).

## What kinds of PRs are welcome

- **EV model corrections.** The seed data in `data/ev_models.csv` and
  `src/lib/ev-models-data.ts` is approximate. If your EV's specs are wrong,
  open a PR with corrected `battery_kwh_usable`, `max_dcfc_kw`, and
  `charge_10_to_80_min` plus a source link in `data/NOTES.md`.
- **Bug fixes** with a reproducer.
- **Small UX improvements** — a11y, mobile polish, copy edits.

## What kinds of PRs are unlikely to land

- **Major architectural changes** without prior discussion in an issue.
- **New connector/network integrations** — these need partnership conversations
  with the network, not just code. See `outreach/` in the planning vault for
  the strategy. If you're at one of these networks (SWTCH, Flo, ChargeLab,
  Ivy, ChargePoint), open a discussion.
- **Adding chargers outside Hamilton + GTA.** v1 is intentionally bounded;
  expansion is on the v1.5+ roadmap. See `v1_plus_roadmap.md` in the
  planning vault.
- **Anything that turns the site into an ad platform / lead-gen funnel /
  paid placement.** Hard no.

## Issues

Use GitHub issues for: bug reports, EV-data corrections, feature requests
that fit the v1.5+ roadmap.

Don't use issues for: questions answerable by reading the README, demands for
features explicitly out of scope (see `v1_plus_roadmap.md`).

## Reporting security issues

See `SECURITY.md`.

## Code of conduct

Be helpful, be honest, be kind. Anyone repeatedly hostile in issues / PRs
will be banned from the repo without further warning. There isn't a longer
formal CoC because the project isn't big enough to need one yet — that
changes if it becomes a problem.
