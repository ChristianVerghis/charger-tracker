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
      <body className="min-h-screen antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
