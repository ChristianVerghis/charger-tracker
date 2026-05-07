import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv();

import { serviceClient } from '../src/db/client.js';
import {
  connectionsToConnectorInserts,
  poiToStationInsert,
  type OcmPoi,
} from '../src/ingest/mappers.js';

const BATCH_SIZE = 500;

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function findLatestSnapshot(): string {
  const dir = join(process.cwd(), 'data', 'snapshots');
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.startsWith('ocm-') && f.endsWith('.json')).sort();
  } catch {
    throw new Error(`No data/snapshots/ directory — run 'pnpm ingest:ocm' first.`);
  }
  const latest = files[files.length - 1];
  if (!latest) throw new Error(`No snapshots in ${dir} — run 'pnpm ingest:ocm' first.`);
  return join(dir, latest);
}

async function main(): Promise<void> {
  const includePlanned = process.argv.includes('--include-planned');
  const explicitPath = process.argv.find((a) => a.endsWith('.json'));
  const snapshotPath = explicitPath ?? findLatestSnapshot();

  console.log(`→ Loading ${snapshotPath}`);
  const pois = JSON.parse(readFileSync(snapshotPath, 'utf-8')) as OcmPoi[];
  console.log(`  ${pois.length} POIs in snapshot`);

  const db = serviceClient();

  const { data: networks, error: nErr } = await db
    .from('networks')
    .select('id, ocm_operator_id');
  if (nErr) throw nErr;
  const opToNetwork = new Map<number, string>();
  for (const n of networks ?? []) {
    if (n.ocm_operator_id != null) opToNetwork.set(n.ocm_operator_id, n.id);
  }
  console.log(`  ${opToNetwork.size} known operator → network mappings`);

  const usable = includePlanned ? pois : pois.filter((p) => p.StatusTypeID !== 150);
  if (!includePlanned) {
    console.log(
      `  ${pois.length - usable.length} 'Planned For Future Date' POIs filtered (use --include-planned to keep them)`,
    );
  }

  const stationRows = usable.map((p) => poiToStationInsert(p, opToNetwork));
  console.log(`→ Upserting ${stationRows.length} stations in batches of ${BATCH_SIZE}…`);
  const ocmIdToStationId = new Map<number, string>();
  for (const batch of chunk(stationRows, BATCH_SIZE)) {
    const { data, error } = await db
      .from('stations')
      .upsert(batch, { onConflict: 'ocm_id' })
      .select('id, ocm_id');
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.ocm_id != null) ocmIdToStationId.set(row.ocm_id, row.id);
    }
  }
  console.log(`  ✓ ${ocmIdToStationId.size} stations`);

  const connectorRows = usable.flatMap((poi) => {
    const sid = ocmIdToStationId.get(poi.ID);
    return sid ? connectionsToConnectorInserts(poi, sid) : [];
  });
  console.log(`→ Upserting ${connectorRows.length} connectors in batches of ${BATCH_SIZE}…`);
  let connectorCount = 0;
  for (const batch of chunk(connectorRows, BATCH_SIZE)) {
    const { error } = await db
      .from('connectors')
      .upsert(batch, { onConflict: 'ocm_connection_id' });
    if (error) throw error;
    connectorCount += batch.length;
  }
  console.log(`  ✓ ${connectorCount} connectors\n`);

  // Coverage check: how many POIs with a known OCM OperatorID landed without a network mapping?
  const unmapped = new Map<number, number>();
  for (const p of usable) {
    if (p.OperatorID != null && !opToNetwork.has(p.OperatorID)) {
      unmapped.set(p.OperatorID, (unmapped.get(p.OperatorID) ?? 0) + 1);
    }
  }
  if (unmapped.size > 0) {
    console.log(`Unmapped OCM operators (top 10):`);
    [...unmapped.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([id, n]) => console.log(`  OperatorID ${id}: ${n} stations`));
    console.log(
      `Add the largest of these to db/migrations/0002_seed_networks.sql to expand coverage.`,
    );
  }

  console.log('Done.');
}

main().catch((err: unknown) => {
  console.error('FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
