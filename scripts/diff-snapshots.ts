import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Diff two OCM snapshots. With no args, diffs the two most recent files in
// data/snapshots/. With two paths, diffs those.
//
//   pnpm diff:snapshots
//   pnpm diff:snapshots data/snapshots/ocm-A.json data/snapshots/ocm-B.json

type RawConnection = {
  ConnectionTypeID: number;
  PowerKW?: number;
  Quantity?: number;
};

type RawPoi = {
  ID: number;
  OperatorID?: number | null;
  AddressInfo: { Title?: string; Town?: string };
  Connections?: RawConnection[];
};

function pickPaths(argv: string[]): [string, string] {
  if (argv.length >= 2) {
    return [argv[0]!, argv[1]!];
  }
  const dir = join(process.cwd(), 'data', 'snapshots');
  const files = readdirSync(dir)
    .filter((f) => f.startsWith('ocm-') && f.endsWith('.json'))
    .sort();
  if (files.length < 2) {
    throw new Error(`Need ≥ 2 snapshots in ${dir} to diff (found ${files.length}).`);
  }
  const a = files[files.length - 2]!;
  const b = files[files.length - 1]!;
  return [join(dir, a), join(dir, b)];
}

function load(path: string): Map<number, RawPoi> {
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as RawPoi[];
  const map = new Map<number, RawPoi>();
  for (const p of raw) map.set(p.ID, p);
  return map;
}

function summary(p: RawPoi): string {
  const conns = p.Connections ?? [];
  const totalQty = conns.reduce((s, c) => s + (c.Quantity ?? 1), 0);
  const maxKw = conns.reduce((m, c) => Math.max(m, c.PowerKW ?? 0), 0);
  const town = p.AddressInfo.Town || '?';
  const name = p.AddressInfo.Title || '(no name)';
  return `${name} (${town}) · ${totalQty} connectors · ${maxKw} kW max`;
}

function connectorSig(p: RawPoi): string {
  const conns = (p.Connections ?? [])
    .map((c) => `${c.ConnectionTypeID}@${c.PowerKW ?? 0}×${c.Quantity ?? 1}`)
    .sort()
    .join(',');
  return conns;
}

const [aPath, bPath] = pickPaths(process.argv.slice(2));
const a = load(aPath);
const b = load(bPath);

const added: RawPoi[] = [];
const removed: RawPoi[] = [];
const changed: Array<{ before: RawPoi; after: RawPoi }> = [];

for (const [id, after] of b) {
  const before = a.get(id);
  if (!before) {
    added.push(after);
    continue;
  }
  if (connectorSig(before) !== connectorSig(after)) {
    changed.push({ before, after });
  }
}
for (const [id, before] of a) {
  if (!b.has(id)) removed.push(before);
}

console.log(`A: ${aPath}  (${a.size} POIs)`);
console.log(`B: ${bPath}  (${b.size} POIs)`);
console.log('');
console.log(`+ ${added.length} added`);
for (const p of added.slice(0, 10)) console.log(`    +${p.ID} · ${summary(p)}`);
if (added.length > 10) console.log(`    … and ${added.length - 10} more`);

console.log(`- ${removed.length} removed`);
for (const p of removed.slice(0, 10)) console.log(`    -${p.ID} · ${summary(p)}`);
if (removed.length > 10) console.log(`    … and ${removed.length - 10} more`);

console.log(`~ ${changed.length} connectors changed`);
for (const { before, after } of changed.slice(0, 10)) {
  console.log(`    ~${after.ID} · ${summary(after)}`);
  console.log(`        was: ${connectorSig(before) || '(none)'}`);
  console.log(`        now: ${connectorSig(after) || '(none)'}`);
}
if (changed.length > 10) console.log(`    … and ${changed.length - 10} more`);
