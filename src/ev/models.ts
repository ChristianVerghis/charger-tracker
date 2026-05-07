import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { Connector as ConnectorType, EVModel } from './types.js';

export type { EVModel } from './types.js';

export const Connector = z.enum(['CCS1', 'J3400', 'CHADEMO']);
export type Connector = ConnectorType;

export const EVModelSchema = z.object({
  id: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().gte(2010).lte(2035),
  trim: z.string().optional(),
  batteryKwhUsable: z.number().positive(),
  maxDcfcKw: z.number().positive(),
  connector: Connector,
  charge10To80Min: z.number().positive(),
  notes: z.string().optional(),
}) satisfies z.ZodType<EVModel>;

const CONNECTOR_NORMALIZE: Record<string, Connector> = {
  CCS1: 'CCS1',
  J3400: 'J3400',
  NACS: 'J3400',
  CHADEMO: 'CHADEMO',
  CHAdeMO: 'CHADEMO',
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Tiny CSV parser — adequate for our seed (no quoted commas, no embedded newlines).
// Swap for `csv-parse` if data ever contains either.
function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim();
    });
    return row;
  });
}

const DEFAULT_CSV = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../data/ev_models.csv',
);

export function loadEvModels(csvPath: string = DEFAULT_CSV): EVModel[] {
  const text = readFileSync(csvPath, 'utf-8');
  const rows = parseCsv(text);
  return rows.map((r, i) => {
    const make = r.make!;
    const model = r.model!;
    const yearStr = r.year!;
    const trim = r.trim || undefined;
    const connectorRaw = r.connector!;
    const connector = CONNECTOR_NORMALIZE[connectorRaw];
    if (!connector) {
      throw new Error(`Row ${i + 2}: unknown connector "${connectorRaw}" for ${make} ${model}`);
    }
    const slug = slugify([make, model, yearStr, trim ?? ''].filter(Boolean).join(' '));
    return EVModelSchema.parse({
      id: slug,
      make,
      model,
      year: Number(yearStr),
      trim,
      batteryKwhUsable: Number(r.battery_kwh_usable),
      maxDcfcKw: Number(r.max_dcfc_kw),
      connector,
      charge10To80Min: Number(r.charge_10_to_80_min),
      notes: r.notes || undefined,
    });
  });
}
