import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();

import { serviceClient } from '../src/db/client.js';
import { loadEvModels } from '../src/ev/models.js';
import type { EvModelInsert } from '../src/db/types.js';

async function main(): Promise<void> {
  const models = loadEvModels();
  console.log(`→ Seeding ${models.length} EV models…`);

  const rows: EvModelInsert[] = models.map((m) => ({
    id: m.id,
    make: m.make,
    model: m.model,
    year: m.year,
    trim: m.trim ?? null,
    battery_kwh_usable: m.batteryKwhUsable,
    max_dcfc_kw: m.maxDcfcKw,
    connector: m.connector,
    charge_10_to_80_min: m.charge10To80Min,
    notes: m.notes ?? null,
  }));

  const db = serviceClient();
  const { error } = await db.from('ev_models').upsert(rows, { onConflict: 'id' });
  if (error) throw error;

  console.log(`  ✓ ${rows.length} EV models upserted`);
}

main().catch((err: unknown) => {
  console.error('FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
