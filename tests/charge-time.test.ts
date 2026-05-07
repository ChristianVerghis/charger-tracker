import { describe, expect, it } from 'vitest';
import { estimateChargeTime } from '../src/ev/charge-time.js';
import type { EVModel } from '../src/ev/models.js';

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

const bolt: EVModel = {
  id: 'chevrolet-bolt-2023',
  make: 'Chevrolet',
  model: 'Bolt EV',
  year: 2023,
  batteryKwhUsable: 65,
  maxDcfcKw: 55,
  connector: 'CCS1',
  charge10To80Min: 60,
};

describe('estimateChargeTime', () => {
  it('matches the reference 10→80% time at peak conditions', () => {
    const r = estimateChargeTime({ ev: ioniq5, startSocPct: 10, targetSocPct: 80, chargerMaxKw: 350 });
    expect(r.minutes).toBeCloseTo(18, 0);
    expect(r.effectiveKw).toBe(235);
    expect(r.cappedAt80).toBe(false);
  });

  it('scales linearly when the charger is the bottleneck', () => {
    // 50 kW vs 235 kW = ~21% of peak rate, so ~18 / 0.213 ≈ 84 minutes
    const r = estimateChargeTime({ ev: ioniq5, startSocPct: 10, targetSocPct: 80, chargerMaxKw: 50 });
    expect(r.minutes).toBeGreaterThan(80);
    expect(r.minutes).toBeLessThan(90);
    expect(r.effectiveKw).toBe(50);
    expect(r.notes.some((n) => n.includes('limited'))).toBe(true);
  });

  it('caps target at 80% with a note', () => {
    const r = estimateChargeTime({ ev: ioniq5, startSocPct: 10, targetSocPct: 100, chargerMaxKw: 350 });
    expect(r.cappedAt80).toBe(true);
    expect(r.targetSocPct).toBe(80);
    expect(r.notes.some((n) => n.toLowerCase().includes('capped'))).toBe(true);
  });

  it('reports energy and range added', () => {
    const r = estimateChargeTime({ ev: ioniq5, startSocPct: 20, targetSocPct: 80, chargerMaxKw: 350 });
    expect(r.energyAddedKwh).toBeCloseTo(77.4 * 0.6, 1);
    expect(r.rangeAddedKm).toBeGreaterThan(200);
  });

  it('handles slow-charging EVs at fast chargers correctly', () => {
    // Bolt is the bottleneck even at a 350 kW charger
    const r = estimateChargeTime({ ev: bolt, startSocPct: 10, targetSocPct: 80, chargerMaxKw: 350 });
    expect(r.effectiveKw).toBe(55);
    expect(r.minutes).toBeCloseTo(60, 0);
  });

  it('rejects invalid inputs', () => {
    expect(() =>
      estimateChargeTime({ ev: ioniq5, startSocPct: 80, targetSocPct: 50, chargerMaxKw: 350 }),
    ).toThrow();
    expect(() =>
      estimateChargeTime({ ev: ioniq5, startSocPct: -10, targetSocPct: 50, chargerMaxKw: 350 }),
    ).toThrow();
    expect(() =>
      estimateChargeTime({ ev: ioniq5, startSocPct: 10, targetSocPct: 80, chargerMaxKw: 0 }),
    ).toThrow();
  });
});
