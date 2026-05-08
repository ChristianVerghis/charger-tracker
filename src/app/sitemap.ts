import type { MetadataRoute } from 'next';
import { getAllStationIds } from '@/lib/server-snapshot';

// Reads the deployment URL from Vercel's standard env var, with a sensible
// localhost fallback for `pnpm build` runs that aren't on Vercel. Update if
// the production domain becomes static.
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const stations = getAllStationIds().map((id) => ({
    url: `${BASE_URL}/station/${id}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));
  return [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...stations,
  ];
}
