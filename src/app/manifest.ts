import type { MetadataRoute } from 'next';

// Web App Manifest. Lets users "Add to Home Screen" on iOS/Android. Theme
// colour matches our slate-950 background; the icon path resolves to the
// dynamic /icon route generated from app/icon.tsx (32×32) plus the bigger
// /apple-icon for iOS Springboard.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'charger-tracker',
    short_name: 'chargers',
    description:
      'Public EV chargers across Hamilton and the GTA. Pick your car for charge-time estimates and connector compatibility.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0b0f14',
    theme_color: '#0b0f14',
    categories: ['transportation', 'maps', 'utilities'],
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
