import { copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Copies the most recent OCM snapshot to prototype/snapshot.json so the
// static prototype page can fetch it via a relative path. Run before
// serving the prototype.

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

const src = findLatestSnapshot();
const dst = join(process.cwd(), 'prototype', 'snapshot.json');
copyFileSync(src, dst);
console.log(`Copied ${src}\n     → ${dst}`);
