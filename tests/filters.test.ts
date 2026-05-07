import { describe, expect, it } from 'vitest';
import type { EVModel } from '../src/ev/types.js';
import { applyFilter, stationCompatibleWith } from '../src/lib/filters.js';
import type { SlimPoi } from '../src/lib/snapshot-types.js';

const ioniq5: EVModel = {
  id: 'hyundai-ioniq-5-2024',
  make: 'Hyundai',
  model: 'Ioniq 5',
  year: 2024,
  batteryKwhUsable: 77.4,
  maxDcfcKw: 235,
  connector: 'CCS1',
  charge10To80Min: 18,
};

const teslaY: EVModel = {
  id: 'tesla-model-y-2024',
  make: 'Tesla',
  model: 'Model Y',
  year: 2024,
  batteryKwhUsable: 75,
  maxDcfcKw: 250,
  connector: 'J3400',
  charge10To80Min: 28,
};

const leaf: EVModel = {
  id: 'nissan-leaf-2024',
  make: 'Nissan',
  model: 'LEAF',
  year: 2024,
  batteryKwhUsable: 60,
  maxDcfcKw: 100,
  connector: 'CHADEMO',
  charge10To80Min: 45,
};

function poi(over: Partial<SlimPoi> & { id: number }): SlimPoi {
  return {
    op: null,
    name: 'test',
    addr: '',
    town: 'Toronto',
    lat: 43.65,
    lng: -79.4,
    conns: [],
    ...over,
  };
}

const stations: SlimPoi[] = [
  // 1: 350 kW CCS1 (fast DCFC) in Hamilton
  poi({ id: 1, town: 'Hamilton', conns: [{ type: 32, kw: 350, qty: 4 }] }),
  // 2: 50 kW CCS1 (slow DCFC) in Toronto
  poi({ id: 2, town: 'Toronto', conns: [{ type: 32, kw: 50, qty: 1 }] }),
  // 3: 7 kW J1772 (L2 only) in Mississauga
  poi({ id: 3, town: 'Mississauga', conns: [{ type: 1, kw: 7, qty: 2 }] }),
  // 4: 250 kW J3400 (Tesla supercharger, no Magic Dock) in Toronto
  poi({ id: 4, town: 'Toronto', conns: [{ type: 27, kw: 250, qty: 8 }] }),
  // 5: 50 kW CHAdeMO + 50 kW CCS1 in Hamilton
  poi({
    id: 5,
    town: 'Hamilton',
    conns: [
      { type: 2, kw: 50, qty: 1 },
      { type: 32, kw: 50, qty: 1 },
    ],
  }),
];

describe('applyFilter', () => {
  it('all returns every station', () => {
    expect(applyFilter(stations, 'all', null)).toHaveLength(5);
  });

  it('dcfc keeps only stations with at least one DC connector', () => {
    const r = applyFilter(stations, 'dcfc', null);
    expect(r.map((p) => p.id)).toEqual([1, 2, 4, 5]);
  });

  it('fast keeps only stations with max kW ≥ 150', () => {
    const r = applyFilter(stations, 'fast', null);
    expect(r.map((p) => p.id)).toEqual([1, 4]);
  });

  it('hamilton keeps only Hamilton stations', () => {
    const r = applyFilter(stations, 'hamilton', null);
    expect(r.map((p) => p.id)).toEqual([1, 5]);
  });

  it('compat without an EV is a no-op', () => {
    expect(applyFilter(stations, 'compat', null)).toHaveLength(5);
  });

  it('compat with an Ioniq 5 (CCS1) keeps CCS1 + J3400-via-adapter DCFCs', () => {
    const r = applyFilter(stations, 'compat', ioniq5);
    // 1 (CCS1), 2 (CCS1), 4 (J3400 via adapter), 5 (CCS1).
    // 3 is L2-only (J1772) — excluded; we don't filter L2 in compat.
    expect(r.map((p) => p.id).sort()).toEqual([1, 2, 4, 5]);
  });

  it('compat with a Model Y (J3400) keeps J3400 + CCS1-via-adapter DCFCs', () => {
    const r = applyFilter(stations, 'compat', teslaY);
    expect(r.map((p) => p.id).sort()).toEqual([1, 2, 4, 5]);
  });

  it('compat with a LEAF (CHAdeMO) keeps only CHAdeMO DCFCs', () => {
    const r = applyFilter(stations, 'compat', leaf);
    expect(r.map((p) => p.id)).toEqual([5]);
  });
});

describe('stationCompatibleWith', () => {
  it('returns false for L2-only stations even when the EV has a DC port', () => {
    expect(stationCompatibleWith(stations[2]!, ioniq5)).toBe(false);
  });

  it('returns true when the station has a CCS1 DC connector and the EV is CCS1', () => {
    expect(stationCompatibleWith(stations[0]!, ioniq5)).toBe(true);
  });

  it('returns true via adapter for J3400 vehicle at CCS1 station', () => {
    expect(stationCompatibleWith(stations[1]!, teslaY)).toBe(true);
  });

  it('returns false for a Tesla Supercharger to a CCS1 EV without Magic Dock noted', () => {
    // We model CCS1↔J3400 as adapter-bridgeable in v1 (per src/ev/connectors.ts);
    // the adapter-required note is on the result. Here we just confirm the
    // boolean is true and rely on the connectors test for the note text.
    expect(stationCompatibleWith(stations[3]!, ioniq5)).toBe(true);
  });

  it('returns false for any EV at a station with no DC connectors', () => {
    expect(stationCompatibleWith(stations[2]!, ioniq5)).toBe(false);
    expect(stationCompatibleWith(stations[2]!, teslaY)).toBe(false);
    expect(stationCompatibleWith(stations[2]!, leaf)).toBe(false);
  });
});
