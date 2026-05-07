'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { SlimPoi } from '@/lib/snapshot-types';
import { hasDcfc, maxKw } from '@/lib/snapshot-types';
import { ChargerMap } from './ChargerMap';
import { Filters, type FilterKey } from './Filters';
import { StationDetail } from './StationDetail';

async function fetchSnapshot(): Promise<SlimPoi[]> {
  const res = await fetch('/data/snapshot.json');
  if (!res.ok) throw new Error(`Failed to load snapshot (${res.status})`);
  return (await res.json()) as SlimPoi[];
}

function applyFilter(pois: SlimPoi[], filter: FilterKey): SlimPoi[] {
  switch (filter) {
    case 'dcfc':
      return pois.filter(hasDcfc);
    case 'fast':
      return pois.filter((p) => maxKw(p) >= 150);
    case 'hamilton':
      return pois.filter((p) => p.town === 'Hamilton');
    case 'all':
    default:
      return pois;
  }
}

export function ChargerExplorer() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['snapshot'],
    queryFn: fetchSnapshot,
  });

  const visible = useMemo(() => (data ? applyFilter(data, filter) : []), [data, filter]);
  const dcfcCount = useMemo(() => visible.filter(hasDcfc).length, [visible]);
  const selected = useMemo(
    () => (data ? data.find((p) => p.id === selectedId) ?? null : null),
    [data, selectedId],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <section className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-2">
          <Filters value={filter} onChange={setFilter} />
          <p className="text-xs text-slate-400">
            {isLoading ? (
              'Loading…'
            ) : error ? (
              <span className="text-amber-400">Snapshot failed to load.</span>
            ) : (
              <>
                <strong className="text-slate-200">{visible.length.toLocaleString()}</strong>{' '}
                stations · <strong className="text-slate-200">{dcfcCount.toLocaleString()}</strong>{' '}
                with DCFC
              </>
            )}
          </p>
        </div>
        <div className="relative flex-1">
          <ChargerMap pois={visible} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </section>
      <aside className="flex max-h-[55vh] flex-col overflow-y-auto border-t border-slate-800 bg-slate-950 md:max-h-none md:w-[380px] md:border-l md:border-t-0">
        <StationDetail station={selected} />
      </aside>
    </div>
  );
}
