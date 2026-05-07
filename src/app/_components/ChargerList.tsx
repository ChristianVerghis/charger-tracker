'use client';

import { useMemo, useState } from 'react';
import type { EVModel } from '@/ev/types';
import {
  CONNECTION_TYPE_NAMES,
  DC_CONNECTION_TYPES,
  hasDcfc,
  maxKw,
  NETWORK_NAMES,
  TIER_COLORS,
  tier,
  type SlimPoi,
} from '@/lib/snapshot-types';
import { stationCompatibleWith } from '@/lib/filters';

export function ChargerList({
  pois,
  selectedId,
  onSelect,
  ev,
}: {
  pois: SlimPoi[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  ev: EVModel | null;
}) {
  const [query, setQuery] = useState('');
  const trimmed = query.trim().toLowerCase();

  const sorted = useMemo(() => {
    const filtered = trimmed
      ? pois.filter((p) => {
          if (p.name.toLowerCase().includes(trimmed)) return true;
          if (p.town.toLowerCase().includes(trimmed)) return true;
          if (p.addr.toLowerCase().includes(trimmed)) return true;
          if (p.op != null) {
            const network = NETWORK_NAMES[p.op];
            if (network && network.toLowerCase().includes(trimmed)) return true;
          }
          return false;
        })
      : pois;
    return [...filtered].sort((a, b) => {
      const ka = maxKw(a);
      const kb = maxKw(b);
      if (ka !== kb) return kb - ka;
      return a.name.localeCompare(b.name);
    });
  }, [pois, trimmed]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 p-2">
        <label className="relative block">
          <span className="sr-only">Search stations</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, town, or network…"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>
        <p className="mt-1 px-1 text-[11px] text-slate-500">
          {sorted.length.toLocaleString()} of {pois.length.toLocaleString()}
          {trimmed ? ` matching "${query}"` : ''}
        </p>
      </div>
      {sorted.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-400">
          {trimmed ? `No stations match "${query}".` : 'No stations match the current filter.'}
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-slate-800 overflow-y-auto">
          {sorted.map((p) => {
            const kw = maxKw(p);
            const t = tier(p);
            const dc = hasDcfc(p);
            const compat = ev ? stationCompatibleWith(p, ev) : null;
            const network =
              p.op != null ? (NETWORK_NAMES[p.op] ?? `Operator ${p.op}`) : 'Unknown operator';
            const dcCounts = countDcConnectors(p);

            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p.id)}
                  aria-current={selectedId === p.id ? 'true' : undefined}
                  className={
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-900 focus:bg-slate-900 focus:outline-none ' +
                    (selectedId === p.id ? 'bg-slate-900' : '')
                  }
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: TIER_COLORS[t] }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-medium text-slate-100">{p.name}</p>
                      <span className="shrink-0 text-xs font-semibold text-slate-200">
                        {kw || '—'} kW
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {[p.town, network].filter(Boolean).join(' · ')}
                    </p>
                    {dc && (
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {dcCounts || 'DC fast charging'}
                      </p>
                    )}
                    {compat === false && (
                      <p className="mt-0.5 text-xs text-amber-400">
                        Not compatible with {ev?.make} {ev?.model}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function countDcConnectors(p: SlimPoi): string {
  const counts = new Map<number, number>();
  for (const c of p.conns) {
    if (!DC_CONNECTION_TYPES.has(c.type)) continue;
    counts.set(c.type, (counts.get(c.type) ?? 0) + (c.qty ?? 1));
  }
  if (counts.size === 0) return '';
  return Array.from(counts.entries())
    .map(([type, qty]) => `${qty}× ${CONNECTION_TYPE_NAMES[type] ?? `Type ${type}`}`)
    .join(' · ');
}
