// Server-side snapshot loader. Imports the slimmed JSON at build time so
// generateMetadata + opengraph-image routes can look up a station synchronously
// without an HTTP fetch. The file is deliberately committed (public/data/) so
// this works on Vercel without DB credentials.
//
// Once Supabase is live, swap this for a parameterised query.

import snapshot from '../../public/data/snapshot.json';
import type { SlimPoi } from './snapshot-types';

const STATIONS = snapshot as SlimPoi[];
const BY_ID = new Map(STATIONS.map((p) => [p.id, p]));

export function getAllStations(): SlimPoi[] {
  return STATIONS;
}

export function getStation(id: number): SlimPoi | null {
  return BY_ID.get(id) ?? null;
}

export function getAllStationIds(): number[] {
  return STATIONS.map((p) => p.id);
}
