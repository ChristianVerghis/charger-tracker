import { Suspense } from 'react';
import { AboutDialog } from './_components/AboutDialog';
import { ChargerExplorer } from './_components/ChargerExplorer';
import { ErrorBoundary } from './_components/ErrorBoundary';
import { Footer } from './_components/Footer';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

// Site-level structured data for Google. Compounds with the per-station
// EVChargingStation JSON-LD on /station/[id]: this lets Google render the
// site title as a sitelinks search box on the SERP, and identifies the
// publisher.
const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'charger-tracker',
      description:
        'Open-data EV charger map for Hamilton and the GTA. Pick your EV for charge-time estimates and compatibility.',
      inLanguage: 'en-CA',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'charger-tracker',
      url: SITE_URL,
    },
  ],
};

export default function HomePage() {
  return (
    <main className="flex h-screen w-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }}
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
          <ChargerExplorer />
        </Suspense>
      </ErrorBoundary>
      <Footer />
    </main>
  );
}
