import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AboutDialog } from '../../_components/AboutDialog';
import { ChargerExplorer } from '../../_components/ChargerExplorer';
import { Footer } from '../../_components/Footer';
import { getStation, getAllStationIds } from '@/lib/server-snapshot';
import {
  CONNECTION_TYPE_NAMES,
  DC_CONNECTION_TYPES,
  hasDcfc,
  maxKw,
  NETWORK_NAMES,
} from '@/lib/snapshot-types';

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const station = getStation(Number(id));
  if (!station) return { title: 'Station not found · charger-tracker' };

  const kw = maxKw(station);
  const network =
    station.op != null ? (NETWORK_NAMES[station.op] ?? `Operator ${station.op}`) : 'Unknown operator';
  const dc = hasDcfc(station);
  const dcSummary = describeDcConnectors(station.conns);
  const title = `${station.name} · ${kw} kW · charger-tracker`;
  const description = [
    network,
    [station.addr, station.town].filter(Boolean).join(', '),
    dc ? dcSummary || 'DC fast charging' : 'L2 charging',
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_CA',
      siteName: 'charger-tracker',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export function generateStaticParams() {
  // Pre-render every station as static at build time. ~1,800 routes — Next
  // handles this fine for static export, and Vercel keeps each one cached.
  return getAllStationIds().map((id) => ({ id: String(id) }));
}

export default async function StationPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const station = getStation(Number(id));
  if (!station) notFound();
  return (
    <main className="flex h-screen w-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            charger-tracker <span className="text-slate-500">·</span>{' '}
            <span className="text-slate-400">Hamilton / GTA</span>
          </h1>
          <p className="text-xs text-slate-500">
            Open-data EV chargers. Pick your car for charge-time estimates. v1 preview.
          </p>
        </div>
        <AboutDialog />
      </header>
      <Suspense fallback={<div className="flex-1 p-4 text-sm text-slate-400">Loading…</div>}>
        <ChargerExplorer initialStationId={Number(id)} />
      </Suspense>
      <Footer />
    </main>
  );
}

function describeDcConnectors(conns: Array<{ type: number; kw: number; qty: number }>): string {
  const counts = new Map<number, number>();
  for (const c of conns) {
    if (!DC_CONNECTION_TYPES.has(c.type)) continue;
    counts.set(c.type, (counts.get(c.type) ?? 0) + (c.qty ?? 1));
  }
  if (counts.size === 0) return '';
  return Array.from(counts.entries())
    .map(([type, qty]) => `${qty}× ${CONNECTION_TYPE_NAMES[type] ?? `Type ${type}`}`)
    .join(' · ');
}
