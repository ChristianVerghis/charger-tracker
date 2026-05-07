import { describe, expect, it } from 'vitest';
import { checkCompatibility } from '../src/ev/connectors.js';

describe('checkCompatibility', () => {
  it('reports native compatibility for matching connectors', () => {
    const r = checkCompatibility('CCS1', 'CCS1');
    expect(r).toEqual({ compatible: true, native: true, notes: [] });
  });

  it('reports adapter compatibility CCS1 vehicle → J3400 charger', () => {
    const r = checkCompatibility('CCS1', 'J3400');
    expect(r.compatible).toBe(true);
    expect(r.native).toBe(false);
    expect(r.notes[0]).toMatch(/Magic-?Dock|adapter/i);
  });

  it('reports adapter compatibility J3400 vehicle → CCS1 charger', () => {
    const r = checkCompatibility('J3400', 'CCS1');
    expect(r.compatible).toBe(true);
    expect(r.native).toBe(false);
    expect(r.notes[0]).toMatch(/adapter/i);
  });

  it('rejects CHAdeMO ↔ anything else', () => {
    expect(checkCompatibility('CHADEMO', 'CCS1').compatible).toBe(false);
    expect(checkCompatibility('CHADEMO', 'J3400').compatible).toBe(false);
    expect(checkCompatibility('CCS1', 'CHADEMO').compatible).toBe(false);
    expect(checkCompatibility('J3400', 'CHADEMO').compatible).toBe(false);
  });
});
