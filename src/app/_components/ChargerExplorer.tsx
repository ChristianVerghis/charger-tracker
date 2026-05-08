'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EV_MODELS } from '@/lib/ev-models-data';
import { applyFilter, isFilterKey, stationCompatibleWith, type FilterKey } from '@/lib/filters';
import { approxKm, type LatLng } from '@/lib/geo';
import { pushRecent } from '@/lib/recently-viewed';
import { hasDcfc, maxKw, type SlimPoi } from '@/lib/snapshot-types';
import { ChargerList } from './ChargerList';
import { StationDetail } from './StationDetail';
import { TopControls, type ViewMode } from './TopControls';

// MapLibre is ~210 KB of the bundle. Lazy-load it so initial JS download
// (and parse) doesn't wait for it. The map area renders a skeleton during
// the chunk fetch — typically tens of milliseconds on a warm connection.
// ssr:false because MapLibre touches `window` at module init.
const ChargerMap = dynamic(() => import('./ChargerMap').then((m) => m.ChargerMap), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-xs text-slate-500">
      Loading map…
    </div>
  ),
});

async function fetchSnapshot(): Promise<SlimPoi[]> {
  const res = await fetch('/data/snapshot.json');
  if (!res.ok) throw new Error(`Failed to load snapshot (${res.status})`);
  return (await res.json()) as SlimPoi[];
}

export function ChargerExplorer({ initialStationId }: { initialStationId?: number } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL is the source of truth. The selected station can come from either:
  //   - the path (`/station/[id]`) — set by `initialStationId` from the
  //     server-rendered page, used for share-links so each station has its
  //     own OG card and metadata.
  //   - the `?station=` query param — supports backwards-compat permalinks
  //     that pre-date the per-station route.
  // Path wins when both are present.
  const evParam = searchParams.get('ev') ?? '';
  const filterParam = searchParams.get('filter');
  const filter: FilterKey = isFilterKey(filterParam) ? filterParam : 'all';
  const stationParam = searchParams.get('station');
  const selectedId =
    initialStationId != null
      ? initialStationId
      : stationParam
        ? Number(stationParam)
        : null;
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

  // Selecting a station drives a path change so each station has its own
  // route + OG card. Clearing returns to `/`. Other params (ev/filter/view)
  // are preserved across the path change.
  const setStation = useCallback(
    (id: number | null) => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete('station');
      const qs = next.toString();
      const path = id != null ? `/station/${id}` : '/';
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    },
    [router, searchParams],
  );

  // If the user lands with `?filter=compat` but no EV (stale permalink), or
  // unpicks the EV later, fall back to "all".
  useEffect(() => {
    if (filter === 'compat' && !ev) setParam({ filter: null });
  }, [ev, filter, setParam]);

  // Track the selected station in localStorage so the empty-state can show
  // a "recently viewed" hint on the user's next visit.
  useEffect(() => {
    if (selectedId != null) pushRecent(selectedId);
  }, [selectedId]);

  // Escape closes the detail panel (when one is open). Native <dialog> handles
  // its own Escape; we skip when a dialog is open so we don't fight it.
  useEffect(() => {
    if (selectedId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('dialog[open]')) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      setStation(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, setStation]);

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

  // Read-once on mount; the list doesn't need to update reactively because
  // the empty state only renders when no station is selected.
  const [recentIds, setRecentIds] = useState<number[]>([]);
  useEffect(() => {
    import('@/lib/recently-viewed').then(({ readRecent }) => setRecentIds(readRecent()));
  }, []);
  const recentStations = useMemo(() => {
    if (!data) return [];
    return recentIds
      .map((id) => data.find((p) => p.id === id))
      .filter((p): p is SlimPoi => !!p && p.id !== selectedId);
  }, [data, recentIds, selectedId]);

  const [startSoc, setStartSoc] = useState(20);
  const [targetSoc, setTargetSoc] = useState(80);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [geoState, setGeoState] = useState<'idle' | 'pending' | 'denied' | 'unavailable'>('idle');

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoState('unavailable');
      return;
    }
    setGeoState('pending');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('idle');
      },
      (err) => {
        setGeoState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  // "Top fast charger near you" — highest-kW DCFC within 25 km of the user's
  // location that's compatible with the picked EV (if one is picked). Used
  // in the StationDetail empty state to surface a useful default action when
  // a returning user grants geolocation.
  const topNearby = useMemo(() => {
    if (!data || !userLocation) return null;
    const RADIUS_KM = 25;
    type Candidate = { p: SlimPoi; kw: number; km: number };
    const cands: Candidate[] = [];
    for (const p of data) {
      if (!hasDcfc(p)) continue;
      if (ev && !stationCompatibleWith(p, ev)) continue;
      const km = approxKm(userLocation, { lat: p.lat, lng: p.lng });
      if (km > RADIUS_KM) continue;
      cands.push({ p, kw: maxKw(p), km });
    }
    if (cands.length === 0) return null;
    cands.sort((a, b) => (b.kw - a.kw) || (a.km - b.km));
    return { station: cands[0]!.p, km: cands[0]!.km, kw: cands[0]!.kw };
  }, [data, userLocation, ev]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopControls
        evId={evId}
        onEvChange={(id) => setParam({ ev: id || null })}
        filter={filter}
        onFilterChange={(next) => setParam({ filter: next === 'all' ? null : next })}
        view={view}
        onViewChange={(next) => setParam({ view: next === 'map' ? null : next })}
        userLocation={userLocation}
        geoState={geoState}
        onRequestLocation={requestLocation}
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
            {(isLoading || error) && <LoadOverlay error={!!error} />}
            {view === 'map' ? (
              <ChargerMap
                pois={visible}
                selectedId={selectedId}
                onSelect={setStation}
                userLocation={userLocation}
              />
            ) : (
              <ChargerList
                pois={visible}
                selectedId={selectedId}
                onSelect={setStation}
                ev={ev}
                userLocation={userLocation}
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
            onClearStation={() => setStation(null)}
            recentStations={recentStations}
            onSelectRecent={setStation}
            topNearby={topNearby}
          />
        </aside>
      </div>
    </div>
  );
}

function LoadOverlay({ error }: { error: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="pointer-events-auto rounded-lg border border-slate-800 bg-slate-950/85 px-4 py-3 text-sm text-slate-200 shadow-xl backdrop-blur">
        {error ? (
          <div className="flex items-center gap-3">
            <span className="text-amber-400">⚠</span>
            <span>
              Couldn't load the charger snapshot. Try refreshing — if it keeps failing, the issue is
              likely on our side.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
              aria-hidden
            />
            <span>Loading 1,800+ chargers across Hamilton & the GTA…</span>
          </div>
        )}
      </div>
    </div>
  );
}
