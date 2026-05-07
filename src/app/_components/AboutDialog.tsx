'use client';

import { useEffect, useRef, useState } from 'react';

export function AboutDialog() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        About
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // Close when the user clicks the backdrop. The dialog itself
          // covers the rect of its content; clicks outside the content
          // hit the dialog element directly.
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className="m-auto w-[min(560px,92vw)] rounded-xl border border-slate-800 bg-slate-950 p-0 text-slate-200 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <h2 className="text-base font-semibold">About charger-tracker</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded p-1 text-slate-500 hover:bg-slate-900 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm leading-relaxed">
          <p>
            A map of every public EV charger across Hamilton and the GTA, with
            an EV-aware twist:{' '}
            <strong className="text-slate-100">pick your car</strong> and the
            map filters to chargers that actually work for it — connector
            compatibility checks (CCS1↔J3400 via adapter; CHAdeMO isolated)
            and an estimated charge-time from any state of charge.
          </p>

          <Section title="Why this exists">
            Public chargers in Ontario are listed in a half-dozen places, each
            with different conventions. Drivers end up bouncing between apps
            mid-trip. This is one map of the dataset most chargers already
            publish, with the EV-specific question — "will this work for{' '}
            <em>my</em> car, and how long will it take?" — answered up front.
          </Section>

          <Section title="Data source">
            Metadata comes from{' '}
            <ExtLink href="https://openchargemap.org/">Open Charge Map</ExtLink>{' '}
            (CC-BY-SA), filtered to a Hamilton + GTA bounding box and dropped
            of stations marked Planned-For-Future. Tiles via{' '}
            <ExtLink href="https://www.openstreetmap.org/">OpenStreetMap</ExtLink>.
            EV battery + DCFC numbers are seeded from manufacturer specs and
            independent test data; expect ±10% on charge-time estimates and
            report errors via the GitHub repo.
          </Section>

          <Section title="What's deliberately not here yet">
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Real-time live status — most networks don't expose it without a
                partnership conversation; v1.5 will integrate the ones that do.
              </li>
              <li>
                Reliability scoring — needs status probes over time (planned).
              </li>
              <li>Cost-per-kWh comparisons — punted past v1 for accuracy reasons.</li>
              <li>Anything north of Barrie or west of Kitchener — out of v1 scope.</li>
            </ul>
          </Section>

          <Section title="Built with">
            Next.js · MapLibre GL · Supabase (coming) · Tailwind · Open Charge Map.
            Hosted on Vercel; runs on free tiers. Open source — see the GitHub
            link in the footer once it's published.
          </Section>
        </div>

        <div className="border-t border-slate-800 px-5 py-3 text-right">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Got it
          </button>
        </div>
      </dialog>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="text-slate-300">{children}</div>
    </section>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-emerald-400 underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}
