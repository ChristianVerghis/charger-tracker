import type { Connector } from './types.js';

export type CompatibilityResult = {
  compatible: boolean;
  native: boolean;
  notes: string[];
};

// CCS1 ↔ J3400 (NACS) is bridgeable in both directions with the right adapter.
// CHAdeMO has no widely-available adapter to either, so treat as isolated.
export function checkCompatibility(vehicle: Connector, charger: Connector): CompatibilityResult {
  if (vehicle === charger) {
    return { compatible: true, native: true, notes: [] };
  }
  if (
    (vehicle === 'CCS1' && charger === 'J3400') ||
    (vehicle === 'J3400' && charger === 'CCS1')
  ) {
    return {
      compatible: true,
      native: false,
      notes: [
        vehicle === 'CCS1'
          ? 'Requires NACS-to-CCS1 adapter; only Magic-Dock-equipped Superchargers accept non-Tesla CCS1 cars without an adapter.'
          : 'Requires Tesla CCS1 adapter at non-Tesla CCS1 chargers.',
      ],
    };
  }
  return {
    compatible: false,
    native: false,
    notes: ['No common adapter path between this vehicle and charger.'],
  };
}
