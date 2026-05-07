import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { QueryProvider } from './providers';
import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';

export const metadata: Metadata = {
  title: 'charger-tracker — Hamilton/GTA EV chargers',
  description:
    'Find public EV chargers across Hamilton and the GTA. Filter by connector, power, and your specific EV. Open data, no login.',
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
