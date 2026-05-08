import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AboutDialog } from '../../_components/AboutDialog';
import { ChargerExplorer } from '../../_components/ChargerExplorer';
import { ErrorBoundary } from '../../_components/ErrorBoundary';
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
  const jsonLd = stationJsonLd(station);
  return (
    <main className="flex h-screen w-screen flex-col">
      <script
        type="application/ld+json"
        // Server-rendered structured data — fed to Google for richer search
        // results once the site is indexed. Per schema.org/EVChargingStation.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
      <ErrorBoundary>
        <Suspense fallback={<div className="flex-1 p-4 text-sm text-slate-400">Loading…</div>}>
          <ChargerExplorer initialStationId={Number(id)} />
        </Suspense>
      </ErrorBoundary>
      <Footer />
    </main>
  );
}

function stationJsonLd(station: ReturnType<typeof getStation>) {
  if (!station) return null;
  const network =
    station.op != null ? (NETWORK_NAMES[station.op] ?? `Operator ${station.op}`) : undefined;
  const dcKw = station.conns
    .filter((c) => DC_CONNECTION_TYPES.has(c.type))
    .reduce((m, c) => Math.max(m, c.kw ?? 0), 0);
  return {
    '@context': 'https://schema.org',
    '@type': 'EVChargingStation',
    name: station.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: station.addr || undefined,
      addressLocality: station.town || undefined,
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: station.lat,
      longitude: station.lng,
    },
    ...(network ? { brand: { '@type': 'Brand', name: network } } : {}),
    ...(dcKw > 0
      ? {
          maximumPower: {
            '@type': 'QuantitativeValue',
            value: dcKw,
            unitCode: 'KWT',
          },
        }
      : {}),
  };
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
