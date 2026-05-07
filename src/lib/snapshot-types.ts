// Shape of `public/data/snapshot.json`, written by `scripts/prepare-web-snapshot.ts`.

export type SlimConnection = {
  type: number;
  current?: number;
  kw: number;
  qty: number;
};

export type SlimPoi = {
  id: number;
  op: number | null;
  name: string;
  addr: string;
  town: string;
  lat: number;
  lng: number;
  conns: SlimConnection[];
};

// OCM ConnectionTypeID → display name (same map the prototype used).
export const CONNECTION_TYPE_NAMES: Record<number, string> = {
  1: 'J1772 (L2)',
  2: 'CHAdeMO',
  25: 'Type 2',
  27: 'NACS / Supercharger',
  30: 'Tesla S/X',
  32: 'CCS Type 1',
};

// DC connector type IDs (rest are AC L2).
export const DC_CONNECTION_TYPES = new Set<number>([2, 27, 30, 32]);

// OCM ConnectionTypeID → our internal Connector enum (browser-safe).
export const CONNECTION_TYPE_TO_CONNECTOR: Record<number, 'CCS1' | 'J3400' | 'CHADEMO'> = {
  2: 'CHADEMO',
  27: 'J3400',
  30: 'J3400',
  32: 'CCS1',
};

// OCM OperatorID → human-readable network name. Mirrors `db/migrations/0002_seed_networks.sql`.
export const NETWORK_NAMES: Record<number, string> = {
  5: 'ChargePoint',
  23: 'Tesla',
  89: 'Flo',
  3372: 'EV Connect',
  3416: 'IVY',
  3488: 'Jule',
  3493: 'SWTCH',
  3534: 'Tesla (Open)',
  3621: 'ChargeLab',
};

export function maxKw(p: SlimPoi): number {
  return p.conns.reduce((m, c) => Math.max(m, c.kw ?? 0), 0);
}

export function hasDcfc(p: SlimPoi): boolean {
  return p.conns.some((c) => DC_CONNECTION_TYPES.has(c.type));
}

export type Tier = 'fast' | 'slow-dc' | 'l2';

export function tier(p: SlimPoi): Tier {
  const kw = maxKw(p);
  if (kw >= 150) return 'fast';
  if (kw >= 50) return 'slow-dc';
  return 'l2';
}

export const TIER_COLORS: Record<Tier, string> = {
  fast: '#10b981',
  'slow-dc': '#f59e0b',
  l2: '#3b82f6',
};
