'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EV_MODELS } from '@/lib/ev-models-data';
import { applyFilter, isFilterKey, type FilterKey } from '@/lib/filters';
import { hasDcfc, type SlimPoi } from '@/lib/snapshot-types';
import { ChargerList } from './ChargerList';
import { ChargerMap } from './ChargerMap';
import { StationDetail } from './StationDetail';
import { TopControls, type ViewMode } from './TopControls';

async function fetchSnapshot(): Promise<SlimPoi[]> {
  const res = await fetch('/data/snapshot.json');
  if (!res.ok) throw new Error(`Failed to load snapshot (${res.status})`);
  return (await res.json()) as SlimPoi[];
}

export function ChargerExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL is the source of truth for ev / filter / station / view.
  const evParam = searchParams.get('ev') ?? '';
  const filterParam = searchParams.get('filter');
  const filter: FilterKey = isFilterKey(filterParam) ? filterParam : 'all';
  const stationParam = searchParams.get('station');
  const selectedId = stationParam ? Number(stationParam) : null;
  const view: ViewMode = searchParams.get('view') === 'list' ? 'list' : 'map';

  const evId = useMemo(
    () => (EV_MODELS.some((m) => m.id === evParam) ? evParam : ''),
    [evParam],
  );
  const ev = useMemo(() => EV_MODELS.find((m) => m.id === evId) ?? null, [evId]);

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // If the user lands with `?filter=compat` but no EV (stale permalink), or
  // unpicks the EV later, fall back to "all".
  useEffect(() => {
    if (filter === 'compat' && !ev) setParam({ filter: null });
  }, [ev, filter, setParam]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['snapshot'],
    queryFn: fetchSnapshot,
  });

  const visible = useMemo(
    () => (data ? applyFilter(data, filter, ev) : []),
    [data, filter, ev],
  );
  const dcfcCount = useMemo(() => visible.filter(hasDcfc).length, [visible]);
  const selected = useMemo(
    () => (data ? (data.find((p) => p.id === selectedId) ?? null) : null),
    [data, selectedId],
  );

  const [startSoc, setStartSoc] = useState(20);
  const [targetSoc, setTargetSoc] = useState(80);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopControls
        evId={evId}
        onEvChange={(id) => setParam({ ev: id || null })}
        filter={filter}
        onFilterChange={(next) => setParam({ filter: next === 'all' ? null : next })}
        view={view}
        onViewChange={(next) => setParam({ view: next === 'map' ? null : next })}
      />
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-1.5 text-xs text-slate-400">
            {isLoading ? (
              'Loading…'
            ) : error ? (
              <span className="text-amber-400">Snapshot failed to load.</span>
            ) : (
              <span>
                <strong className="text-slate-200">{visible.length.toLocaleString()}</strong>{' '}
                stations ·{' '}
                <strong className="text-slate-200">{dcfcCount.toLocaleString()}</strong> with DCFC
                {filter === 'compat' && ev && (
                  <span className="text-emerald-300">
                    {' '}
                    · compatible with {ev.make} {ev.model}
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="relative flex-1">
            {view === 'map' ? (
              <ChargerMap
                pois={visible}
                selectedId={selectedId}
                onSelect={(id) => setParam({ station: String(id) })}
              />
            ) : (
              <ChargerList
                pois={visible}
                selectedId={selectedId}
                onSelect={(id) => setParam({ station: String(id) })}
                ev={ev}
              />
            )}
          </div>
        </section>
        <aside className="flex max-h-[55vh] flex-col overflow-y-auto border-t border-slate-800 bg-slate-950 md:max-h-none md:w-[380px] md:border-l md:border-t-0">
          <StationDetail
            station={selected}
            ev={ev}
            startSoc={startSoc}
            targetSoc={targetSoc}
            onStartSocChange={setStartSoc}
            onTargetSocChange={setTargetSoc}
            onClearStation={() => setParam({ station: null })}
          />
        </aside>
      </div>
    </div>
  );
}
