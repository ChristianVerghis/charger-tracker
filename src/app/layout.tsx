import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { QueryProvider } from './providers';
import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';

const TITLE = 'charger-tracker — Hamilton/GTA EV chargers';
const DESCRIPTION =
  'Find public EV chargers across Hamilton and the GTA. Filter by connector, power, and your specific EV. Open data, no login.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'charger-tracker',
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    locale: 'en_CA',
    siteName: 'charger-tracker',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Start the snapshot fetch during JS parse, before TanStack Query kicks
            in. Saves ~100-300 ms on cold loads — the snapshot is on the
            critical path for both the map and the list. */}
        <link
          rel="preload"
          as="fetch"
          href="/data/snapshot.json"
          crossOrigin="anonymous"
          type="application/json"
        />
      </head>
      <body className="min-h-screen antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
