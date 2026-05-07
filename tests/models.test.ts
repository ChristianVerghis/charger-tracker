import { describe, expect, it } from 'vitest';
import { loadEvModels } from '../src/ev/models.js';

describe('loadEvModels', () => {
  it('loads all rows from the seed CSV', () => {
    const models = loadEvModels();
    expect(models.length).toBeGreaterThanOrEqual(30);
  });

  it('produces unique slug ids per model', () => {
    const models = loadEvModels();
    const ids = models.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('normalizes connector strings', () => {
    const models = loadEvModels();
    for (const m of models) {
      expect(['CCS1', 'J3400', 'CHADEMO']).toContain(m.connector);
    }
  });

  it('produces sane numbers', () => {
    const models = loadEvModels();
    for (const m of models) {
      expect(m.batteryKwhUsable).toBeGreaterThan(20);
      expect(m.batteryKwhUsable).toBeLessThan(250);
      expect(m.maxDcfcKw).toBeGreaterThan(0);
      expect(m.charge10To80Min).toBeGreaterThan(10);
      expect(m.charge10To80Min).toBeLessThan(120);
    }
  });
});
