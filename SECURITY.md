# Security policy

## Supported versions

Only `main` is supported. There are no point-release branches.

## Reporting a vulnerability

**Please don't open public issues for security problems.** Instead, contact
the maintainer privately:

- GitHub: open a [private vulnerability report][gh-advisory] on this repo —
  this is the preferred channel because it gives us a paper trail.
- Email: Christian's email is in his GitHub profile.

Expect an acknowledgement within 5 business days. Once a fix is ready, we'll
coordinate a disclosure window with you (typically 14–30 days depending on
severity) and credit you in the changelog if you'd like.

[gh-advisory]: https://github.com/ChristianVerghis/charger-tracker/security/advisories/new

## Scope

In scope:

- The deployed web app (production URL once a custom domain is attached).
- The Next.js application code in this repository.
- The OCM ingestion pipeline (`scripts/`).
- The Supabase schema (`db/migrations/`) once the database is provisioned.

Out of scope (please don't report these):

- Vulnerabilities in third-party services we use (Vercel, Supabase, OCM,
  OpenStreetMap). Report those to the relevant vendor.
- Issues requiring physical access to a user's device.
- Self-XSS, self-CSRF, social engineering attacks against the maintainer.
- Missing rate limits on best-effort public endpoints.
- DNS issues for any domain we don't own.

## Preferred disclosure for partners

If you're an EV-network partner (SWTCH, Flo, ChargeLab, Ivy, ChargePoint, or
otherwise) and the vulnerability concerns access to your data through this
project, please flag it as such — we'll prioritize and route accordingly.
