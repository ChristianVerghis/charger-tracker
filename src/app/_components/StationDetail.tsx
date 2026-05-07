'use client';

import { useState } from 'react';
import { estimateChargeTime } from '@/ev/charge-time';
import { checkCompatibility } from '@/ev/connectors';
import type { Connector, EVModel } from '@/ev/types';
import {
  CONNECTION_TYPE_NAMES,
  CONNECTION_TYPE_TO_CONNECTOR,
  DC_CONNECTION_TYPES,
  NETWORK_NAMES,
  type SlimConnection,
  type SlimPoi,
  maxKw,
} from '@/lib/snapshot-types';

const TIER_BADGE: Record<string, string> = {
  fast: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40',
  'slow-dc': 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40',
  l2: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/40',
};

function tierForKw(kw: number): keyof typeof TIER_BADGE {
  if (kw >= 150) return 'fast';
  if (kw >= 50) return 'slow-dc';
  return 'l2';
}

function bestDcfcKw(conns: SlimConnection[]): number {
  return conns
    .filter((c) => DC_CONNECTION_TYPES.has(c.type))
    .reduce((m, c) => Math.max(m, c.kw ?? 0), 0);
}

function mapsUrlFor(p: SlimPoi): string {
  // Google Maps universal URL. iOS opens in Apple Maps via the universal link
  // when the user has it set as default; otherwise stays on Google Maps web.
  // Kept simple — a `geo:` URI works on Android but not iOS Safari.
  const q = encodeURIComponent(`${p.name}, ${p.addr || ''} ${p.town}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}&query_place_id=&q=${q}`;
}

function bestDcfcConnector(conns: SlimConnection[]): Connector | null {
  const dc = conns.filter((c) => DC_CONNECTION_TYPES.has(c.type));
  if (dc.length === 0) return null;
  const top = dc.reduce((a, b) => ((a.kw ?? 0) >= (b.kw ?? 0) ? a : b));
  return CONNECTION_TYPE_TO_CONNECTOR[top.type] ?? null;
}

export function StationDetail({
  station,
  ev,
  startSoc,
  targetSoc,
  onStartSocChange,
  onTargetSocChange,
  onClearStation,
}: {
  station: SlimPoi | null;
  ev: EVModel | null;
  startSoc: number;
  targetSoc: number;
  onStartSocChange: (v: number) => void;
  onTargetSocChange: (v: number) => void;
  onClearStation: () => void;
}) {
  if (!station) {
    return (
      <div className="p-4 text-sm text-slate-400">
        <p className="mb-2 font-medium text-slate-200">No station selected.</p>
        <p>
          {ev
            ? `Tap a station to see how long this charger would take for your ${ev.make} ${ev.model}.`
            : 'Pick your EV in the bar above, then tap a station for an estimated charge time.'}
        </p>
        <Legend />
      </div>
    );
  }

  const stationKw = maxKw(station);
  const stationTier = tierForKw(stationKw);
  const dcfcKw = bestDcfcKw(station.conns);
  const stationConnector = bestDcfcConnector(station.conns);
  const networkName =
    station.op != null
      ? (NETWORK_NAMES[station.op] ?? `Operator ${station.op}`)
      : 'Unknown operator';

  const compatibility =
    ev && stationConnector ? checkCompatibility(ev.connector, stationConnector) : null;

  const showEstimate =
    !!ev && dcfcKw > 0 && targetSoc > startSoc && (compatibility?.compatible ?? false);

  const estimate =
    showEstimate && ev
      ? estimateChargeTime({
          ev,
          startSocPct: startSoc,
          targetSocPct: targetSoc,
          chargerMaxKw: dcfcKw,
        })
      : null;

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      <header>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-100">{station.name}</h2>
          <button
            type="button"
            onClick={onClearStation}
            className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-900 hover:text-slate-200"
            aria-label="Close station detail"
          >
            ✕
          </button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TIER_BADGE[stationTier]}`}
          >
            {stationKw} kW
          </span>
          <p className="text-xs text-slate-500">{networkName}</p>
          <ShareLinkButton />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {[station.addr, station.town].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <a
            href={mapsUrlFor(station)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <span aria-hidden>↗</span> Open in Maps
          </a>
          <a
            href={`https://openchargemap.org/site/poi/details/${station.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
          >
            View on Open Charge Map
          </a>
        </div>
      </header>

      <section>
        <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
          Connectors
        </h3>
        <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
          {station.conns.length === 0 && (
            <li className="px-3 py-2 text-xs text-slate-500">No connectors listed in OCM.</li>
          )}
          {station.conns.map((c, i) => {
            const name = CONNECTION_TYPE_NAMES[c.type] ?? `Type ${c.type}`;
            const tBadge = TIER_BADGE[tierForKw(c.kw)];
            return (
              <li key={`${c.type}-${i}`} className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-slate-100">{name}</p>
                  <p className="text-xs text-slate-500">×{c.qty}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tBadge}`}>
                  {c.kw || '—'} kW
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
          Charge-time estimate
        </h3>

        {!ev && (
          <p className="rounded-md border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-500">
            Pick a vehicle in the bar above to see how long this charger would take.
          </p>
        )}

        {ev && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <SocSlider
                label="Start"
                value={startSoc}
                onChange={onStartSocChange}
                max={Math.max(0, targetSoc - 5)}
              />
              <SocSlider
                label="Target"
                value={targetSoc}
                onChange={onTargetSocChange}
                max={100}
                min={Math.min(100, startSoc + 5)}
              />
            </div>

            <div className="mt-3 rounded-md border border-slate-800 bg-slate-900/50 p-3">
              {dcfcKw === 0 && (
                <p className="text-xs text-amber-300">
                  No DC fast-charging at this station — no useful estimate for {ev.make} {ev.model}.
                </p>
              )}
              {dcfcKw > 0 && compatibility && !compatibility.compatible && (
                <p className="text-xs text-amber-300">{compatibility.notes.join(' ')}</p>
              )}
              {estimate && (
                <div className="space-y-1.5">
                  <p className="text-slate-100">
                    <strong className="text-emerald-300">{Math.round(estimate.minutes)} min</strong>{' '}
                    to go from {estimate.startSocPct}% → {estimate.targetSocPct}%
                  </p>
                  <p className="text-xs text-slate-400">
                    Adds ~{Math.round(estimate.energyAddedKwh)} kWh ·{' '}
                    ~{Math.round(estimate.rangeAddedKm)} km · effective rate{' '}
                    {Math.round(estimate.effectiveKw)} kW
                    {compatibility && !compatibility.native ? ' · adapter required' : ''}
                  </p>
                  {estimate.notes.map((n, i) => (
                    <p key={i} className="text-xs text-slate-500">
                      {n}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <Legend />
    </div>
  );
}

function SocSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-400">{label} SoC</span>
        <span className="text-xs font-medium text-slate-200">{value}%</span>
      </div>
      <input
        type="range"
        min={Math.max(0, min)}
        max={Math.min(100, max)}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-emerald-500"
      />
    </label>
  );
}

function ShareLinkButton() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const onCopy = async () => {
    const url = window.location.href;
    if (await copyToClipboard(url)) {
      setState('copied');
      setTimeout(() => setState('idle'), 1500);
    } else {
      setState('failed');
      setTimeout(() => setState('idle'), 2500);
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="ml-auto rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-label="Copy share link to clipboard"
    >
      <span aria-live="polite">
        {state === 'copied' ? 'Copied ✓' : state === 'failed' ? 'Copy failed' : 'Copy link'}
      </span>
    </button>
  );
}

async function copyToClipboard(text: string): Promise<boolean> {
  // Modern path: navigator.clipboard. Requires a secure context (HTTPS or
  // localhost). Falls back to the textarea + execCommand trick for older
  // browsers and a few iOS in-app webviews where the modern API is missing.
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy path
    }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function Legend() {
  return (
    <section className="border-t border-slate-800 pt-3 text-xs text-slate-500">
      <h3 className="mb-1.5 font-medium uppercase tracking-wide text-slate-400">Legend</h3>
      <ul className="space-y-1">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> ≥ 150 kW (fast DCFC)
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 50–149 kW (slow DCFC)
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> &lt; 50 kW (L2 only)
        </li>
      </ul>
      <p className="mt-2">
        Source: Open Charge Map metadata snapshot. Live status not yet wired up — see roadmap.
      </p>
    </section>
  );
}
