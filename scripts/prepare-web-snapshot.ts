import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Reads the most recent OCM snapshot from data/snapshots/, slims it down to just
// the fields the public web app needs, and writes it to public/data/snapshot.json
// so Vercel ships it as a static asset. The full OCM payload is ~2.2 MB; the
// slimmed version is ~600-900 KB depending on connector counts.

type RawConnection = {
  ID: number;
  ConnectionTypeID: number;
  CurrentTypeID?: number;
  PowerKW?: number;
  Quantity?: number;
};

type RawPoi = {
  ID: number;
  OperatorID?: number | null;
  StatusTypeID?: number | null;
  AddressInfo: {
    Title?: string;
    AddressLine1?: string;
    Town?: string;
    StateOrProvince?: string;
    Postcode?: string;
    Latitude: number;
    Longitude: number;
  };
  Connections?: RawConnection[];
};

type SlimConnection = {
  type: number;
  current?: number;
  kw: number;
  qty: number;
};

type SlimPoi = {
  id: number;
  op: number | null;
  name: string;
  addr: string;
  town: string;
  lat: number;
  lng: number;
  conns: SlimConnection[];
};

function findLatestSnapshot(): string {
  const dir = join(process.cwd(), 'data', 'snapshots');
  const files = readdirSync(dir)
    .filter((f) => f.startsWith('ocm-') && f.endsWith('.json'))
    .sort();
  const latest = files[files.length - 1];
  if (!latest) {
    throw new Error(`No snapshots in ${dir} — run 'pnpm ingest:ocm' first.`);
  }
  return join(dir, latest);
}

function slim(pois: RawPoi[]): SlimPoi[] {
  return pois.map((p) => ({
    id: p.ID,
    op: p.OperatorID ?? null,
    name: p.AddressInfo.Title ?? '(no name)',
    addr: p.AddressInfo.AddressLine1 ?? '',
    town: p.AddressInfo.Town ?? '',
    lat: p.AddressInfo.Latitude,
    lng: p.AddressInfo.Longitude,
    conns: (p.Connections ?? []).map((c) => ({
      type: c.ConnectionTypeID,
      current: c.CurrentTypeID,
      kw: c.PowerKW ?? 0,
      qty: c.Quantity ?? 1,
    })),
  }));
}

const src = findLatestSnapshot();
const raw = JSON.parse(readFileSync(src, 'utf-8')) as RawPoi[];
const slimmed = slim(raw);

const dstDir = join(process.cwd(), 'public', 'data');
mkdirSync(dstDir, { recursive: true });
const dst = join(dstDir, 'snapshot.json');
writeFileSync(dst, JSON.stringify(slimmed));

const beforeKb = Math.round(JSON.stringify(raw).length / 1024);
const afterKb = Math.round(JSON.stringify(slimmed).length / 1024);
console.log(`Slimmed ${raw.length} POIs: ${beforeKb} KB → ${afterKb} KB`);
console.log(`  src: ${src}`);
console.log(`  dst: ${dst}`);
