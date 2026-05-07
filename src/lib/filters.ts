// Filter definitions for the charger explorer. Lives in /lib so the URL <→
// state plumbing in ChargerExplorer can import it without pulling in any
// React-only modules.

import { checkCompatibility } from '@/ev/connectors';
import type { Connector, EVModel } from '@/ev/types';
import {
  CONNECTION_TYPE_TO_CONNECTOR,
  DC_CONNECTION_TYPES,
  hasDcfc,
  maxKw,
  type SlimPoi,
} from './snapshot-types';

export type FilterKey = 'all' | 'dcfc' | 'fast' | 'hamilton' | 'compat';

export const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  dcfc: 'DCFC only',
  fast: '≥150 kW',
  hamilton: 'Hamilton',
  compat: 'Works for my EV',
};

export const FILTER_KEYS: ReadonlyArray<FilterKey> = [
  'all',
  'dcfc',
  'fast',
  'hamilton',
  'compat',
];

export function isFilterKey(s: string | null | undefined): s is FilterKey {
  return !!s && (FILTER_KEYS as readonly string[]).includes(s);
}

// "Compatible with the EV" = the station has at least one DC connector that
// the EV can use natively or via adapter. We don't filter on L2 here because
// nearly every EV in our seed accepts J1772 L2, so the chip would be a no-op.
export function stationCompatibleWith(p: SlimPoi, ev: EVModel): boolean {
  for (const c of p.conns) {
    if (!DC_CONNECTION_TYPES.has(c.type)) continue;
    const stationConnector: Connector | undefined = CONNECTION_TYPE_TO_CONNECTOR[c.type];
    if (!stationConnector) continue;
    if (checkCompatibility(ev.connector, stationConnector).compatible) return true;
  }
  return false;
}

export function applyFilter(
  pois: SlimPoi[],
  filter: FilterKey,
  ev: EVModel | null,
): SlimPoi[] {
  switch (filter) {
    case 'dcfc':
      return pois.filter(hasDcfc);
    case 'fast':
      return pois.filter((p) => maxKw(p) >= 150);
    case 'hamilton':
      return pois.filter((p) => p.town === 'Hamilton');
    case 'compat':
      if (!ev) return pois;
      return pois.filter((p) => stationCompatibleWith(p, ev));
    case 'all':
    default:
      return pois;
  }
}
