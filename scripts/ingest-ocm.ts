import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Load .env.local first (Next.js convention), then fall back to .env.
loadEnv({ path: '.env.local' });
loadEnv();

const OCM_API_BASE = 'https://api.openchargemap.io/v3';

// Bounding box covering Hamilton + GTA per spec.md. SW corner → NE corner.
const GTA_BOUNDING_BOX = {
  sw: { lat: 43.18, lng: -80.00 }, // Stoney Creek / Burlington
  ne: { lat: 43.95, lng: -79.10 }, // Markham / Vaughan
};

const Connection = z.object({
  ID: z.number(),
  ConnectionTypeID: z.number().nullable().optional(),
  StatusTypeID: z.number().nullable().optional(),
  LevelID: z.number().nullable().optional(),
  PowerKW: z.number().nullable().optional(),
  Quantity: z.number().nullable().optional(),
  CurrentTypeID: z.number().nullable().optional(),
}).passthrough();

const AddressInfo = z.object({
  ID: z.number(),
  Title: z.string().nullable().optional(),
  AddressLine1: z.string().nullable().optional(),
  Town: z.string().nullable().optional(),
  StateOrProvince: z.string().nullable().optional(),
  Postcode: z.string().nullable().optional(),
  CountryID: z.number().nullable().optional(),
  Latitude: z.number(),
  Longitude: z.number(),
}).passthrough();

const POI = z.object({
  ID: z.number(),
  UUID: z.string().optional(),
  AddressInfo,
  Connections: z.array(Connection).nullable().optional(),
  OperatorID: z.number().nullable().optional(),
  StatusTypeID: z.number().nullable().optional(),
  DateLastStatusUpdate: z.string().nullable().optional(),
  DateLastVerified: z.string().nullable().optional(),
}).passthrough();

const POIArray = z.array(POI);
type POI = z.infer<typeof POI>;

function buildUrl(): URL {
  const url = new URL(`${OCM_API_BASE}/poi`);
  const { sw, ne } = GTA_BOUNDING_BOX;
  url.searchParams.set('boundingbox', `(${sw.lat},${sw.lng}),(${ne.lat},${ne.lng})`);
  url.searchParams.set('countrycode', 'CA');
  url.searchParams.set('maxresults', '5000');
  url.searchParams.set('compact', 'true');
  url.searchParams.set('verbose', 'false');
  return url;
}

async function fetchPOIs(apiKey: string): Promise<POI[]> {
  const url = buildUrl();
  console.log(`→ GET ${url.toString()}`);

  const start = Date.now();
  const res = await fetch(url, {
    headers: {
      'X-API-Key': apiKey,
      Accept: 'application/json',
      'User-Agent': 'charger-tracker-poc/0.1 (+https://github.com/cverghis)',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OCM ${res.status} ${res.statusText}\n${body.slice(0, 500)}`);
  }

  const json: unknown = await res.json();
  const pois = POIArray.parse(json);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`← ${pois.length} POIs in ${elapsed}s`);
  return pois;
}

type Resolver = {
  operatorName: (id: number) => string;
  connectorTypeName: (id: number) => string;
  statusName: (id: number) => string;
  hasReferenceData: boolean;
};

function loadReferenceData(): Resolver {
  try {
    const path = join(process.cwd(), 'data', 'ocm-reference.json');
    const ref = JSON.parse(readFileSync(path, 'utf-8')) as {
      Operators: Array<{ ID: number; Title: string }>;
      ConnectionTypes: Array<{ ID: number; Title: string }>;
      StatusTypes: Array<{ ID: number; Title: string }>;
    };
    const ops = new Map(ref.Operators.map((o) => [o.ID, o.Title]));
    const conns = new Map(ref.ConnectionTypes.map((c) => [c.ID, c.Title]));
    const stats = new Map(ref.StatusTypes.map((s) => [s.ID, s.Title]));
    return {
      operatorName: (id) => ops.get(id) ?? `OperatorID ${id}`,
      connectorTypeName: (id) => conns.get(id) ?? `ConnectionTypeID ${id}`,
      statusName: (id) => stats.get(id) ?? `StatusID ${id}`,
      hasReferenceData: true,
    };
  } catch {
    return {
      operatorName: (id) => `OperatorID ${id}`,
      connectorTypeName: (id) => `ConnectionTypeID ${id}`,
      statusName: (id) => `StatusID ${id}`,
      hasReferenceData: false,
    };
  }
}

function summarize(pois: POI[], resolver: Resolver): void {
  const byOperator = new Map<number, number>();
  const byConnectorType = new Map<number, number>();
  const byStatus = new Map<number, number>();
  const byTown = new Map<string, number>();
  let totalConnections = 0;
  let powerSum = 0;
  let powerCount = 0;

  for (const poi of pois) {
    if (poi.OperatorID != null) {
      byOperator.set(poi.OperatorID, (byOperator.get(poi.OperatorID) ?? 0) + 1);
    }
    if (poi.StatusTypeID != null) {
      byStatus.set(poi.StatusTypeID, (byStatus.get(poi.StatusTypeID) ?? 0) + 1);
    }
    const town = poi.AddressInfo.Town?.trim();
    if (town) byTown.set(town, (byTown.get(town) ?? 0) + 1);

    for (const c of poi.Connections ?? []) {
      totalConnections += c.Quantity ?? 1;
      if (c.ConnectionTypeID != null) {
        byConnectorType.set(c.ConnectionTypeID, (byConnectorType.get(c.ConnectionTypeID) ?? 0) + 1);
      }
      if (c.PowerKW != null && c.PowerKW > 0) {
        powerSum += c.PowerKW;
        powerCount += 1;
      }
    }
  }

  const avgPower = powerCount > 0 ? (powerSum / powerCount).toFixed(1) : 'n/a';
  const top = (m: Map<number | string, number>, n = 10) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

  console.log('\n=== Summary ===');
  console.log(`Stations:           ${pois.length}`);
  console.log(`Connectors (sum):   ${totalConnections}`);
  console.log(`Avg connector kW:   ${avgPower}`);
  if (!resolver.hasReferenceData) {
    console.log(
      '\n(IDs not resolved — run `pnpm fetch:ocm-reference` once to enable name lookups.)',
    );
  }
  console.log('\nTop operators:');
  for (const [id, n] of top(byOperator) as Array<[number, number]>) {
    console.log(`  ${String(n).padStart(5)}  ${resolver.operatorName(id)}`);
  }
  console.log('\nTop connector types:');
  for (const [id, n] of top(byConnectorType) as Array<[number, number]>) {
    console.log(`  ${String(n).padStart(5)}  ${resolver.connectorTypeName(id)}`);
  }
  console.log('\nStation status distribution:');
  for (const [id, n] of top(byStatus) as Array<[number, number]>) {
    console.log(`  ${String(n).padStart(5)}  ${resolver.statusName(id)}`);
  }
  console.log('\nTop towns:');
  for (const [t, n] of top(byTown, 15)) console.log(`  ${String(n).padStart(5)}  ${t}`);
}

async function writeSnapshot(pois: POI[]): Promise<string> {
  const outDir = join(process.cwd(), 'data', 'snapshots');
  await mkdir(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = join(outDir, `ocm-${ts}.json`);
  await writeFile(outFile, JSON.stringify(pois, null, 2));
  return outFile;
}

async function main(): Promise<void> {
  const apiKey = process.env.OCM_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      [
        'Missing OCM_API_KEY.',
        '',
        '1. Register a free key at https://openchargemap.org/site/profile/applications',
        '2. Copy .env.example to .env.local',
        '3. Paste your key as OCM_API_KEY=...',
        '',
        'Then re-run: pnpm ingest:ocm',
      ].join('\n'),
    );
    process.exit(1);
  }

  const includePlanned = process.argv.includes('--include-planned');

  const pois = await fetchPOIs(apiKey);
  const filtered = includePlanned ? pois : pois.filter((p) => p.StatusTypeID !== 150);
  if (!includePlanned && filtered.length < pois.length) {
    console.log(
      `Filtered ${pois.length - filtered.length} 'Planned For Future Date' POIs (use --include-planned to keep them).`,
    );
  }

  const resolver = loadReferenceData();
  summarize(filtered, resolver);
  const snapshot = await writeSnapshot(filtered);
  console.log(`\nWrote snapshot: ${snapshot}`);
}

main().catch((err: unknown) => {
  console.error('\nFAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
