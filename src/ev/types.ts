// Browser-safe types for the EV-insight feature. `models.ts` adds the CSV
// loader + zod schema for server-side use; `charge-time.ts` and `connectors.ts`
// only need the types and run in both environments.

export type Connector = 'CCS1' | 'J3400' | 'CHADEMO';

export type EVModel = {
  id: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  batteryKwhUsable: number;
  maxDcfcKw: number;
  connector: Connector;
  charge10To80Min: number;
  notes?: string;
};
