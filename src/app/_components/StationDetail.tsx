'use client';

import { useMemo, useState } from 'react';
import { estimateChargeTime } from '@/ev/charge-time';
import { checkCompatibility } from '@/ev/connectors';
import type { Connector } from '@/ev/types';
import { EV_MODELS } from '@/lib/ev-models-data';
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

function bestDcfcConnector(conns: SlimConnection[]): Connector | null {
  const dc = conns.filter((c) => DC_CONNECTION_TYPES.has(c.type));
  if (dc.length === 0) return null;
  const top = dc.reduce((a, b) => ((a.kw ?? 0) >= (b.kw ?? 0) ? a : b));
  return CONNECTION_TYPE_TO_CONNECTOR[top.type] ?? null;
}

export function StationDetail({ station }: { station: SlimPoi | null }) {
  const [selectedEvId, setSelectedEvId] = useState<string>('');
  const [startSoc, setStartSoc] = useState(20);
  const [targetSoc, setTargetSoc] = useState(80);
  const selectedEv = useMemo(
    () => EV_MODELS.find((m) => m.id === selectedEvId) ?? null,
    [selectedEvId],
  );

  if (!station) {
    return (
      <div className="p-4 text-sm text-slate-400">
        <p className="mb-2 font-medium text-slate-200">No station selected.</p>
        <p>Tap a coloured dot on the map to see its connectors and a charge-time estimate.</p>
        <Legend />
      </div>
    );
  }

  const stationKw = maxKw(station);
  const stationTier = tierForKw(stationKw);
  const dcfcKw = bestDcfcKw(station.conns);
  const stationConnector = bestDcfcConnector(station.conns);
  const networkName =
    station.op != null ? (NETWORK_NAMES[station.op] ?? `Operator ${station.op}`) : 'Unknown operator';

  const compatibility =
    selectedEv && stationConnector
      ? checkCompatibility(selectedEv.connector, stationConnector)
      : null;

  const showEstimate =
    selectedEv && dcfcKw > 0 && targetSoc > startSoc && (compatibility?.compatible ?? false);

  const estimate = showEstimate
    ? estimateChargeTime({
        ev: selectedEv,
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
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TIER_BADGE[stationTier]}`}
          >
            {stationKw} kW
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {[station.addr, station.town].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-1 text-xs text-slate-500">{networkName}</p>
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
        <label className="mb-2 block">
          <span className="text-xs text-slate-400">Your EV</span>
          <select
            value={selectedEvId}
            onChange={(e) => setSelectedEvId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"
          >
            <option value="">— pick a vehicle —</option>
            {EV_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.year} {m.make} {m.model}
                {m.trim ? ` · ${m.trim}` : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <SocSlider label="Start" value={startSoc} onChange={setStartSoc} max={targetSoc - 5} />
          <SocSlider label="Target" value={targetSoc} onChange={setTargetSoc} max={100} min={startSoc + 5} />
        </div>

        <div className="mt-3 rounded-md border border-slate-800 bg-slate-900/50 p-3">
          {!selectedEv && (
            <p className="text-xs text-slate-500">
              Pick a vehicle above to see how long this charger would take.
            </p>
          )}
          {selectedEv && dcfcKw === 0 && (
            <p className="text-xs text-amber-300">
              No DC fast-charging at this station — no useful estimate for {selectedEv.make}{' '}
              {selectedEv.model}.
            </p>
          )}
          {selectedEv && dcfcKw > 0 && compatibility && !compatibility.compatible && (
            <p className="text-xs text-amber-300">
              {compatibility.notes.join(' ')}
            </p>
          )}
          {selectedEv && estimate && (
            <div className="space-y-1.5">
              <p className="text-slate-100">
                <strong className="text-emerald-300">{Math.round(estimate.minutes)} min</strong> to
                go from {estimate.startSocPct}% → {estimate.targetSocPct}%
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
