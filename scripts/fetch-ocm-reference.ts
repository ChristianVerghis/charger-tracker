import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv();

// Fetches OCM reference data (ConnectionTypes, OperatorInfo, StatusTypes,
// CountryInfo, etc.) and writes it to data/ocm-reference.json.
// Commit the result — IDs change rarely. Re-run when summary stats show
// an unfamiliar ID.

async function main(): Promise<void> {
  const apiKey = process.env.OCM_API_KEY?.trim();
  if (!apiKey) {
    console.error('Missing OCM_API_KEY (see .env.example).');
    process.exit(1);
  }

  const url = 'https://api.openchargemap.io/v3/referencedata';
  console.log(`→ GET ${url}`);
  const res = await fetch(url, {
    headers: {
      'X-API-Key': apiKey,
      Accept: 'application/json',
      'User-Agent': 'charger-tracker-poc/0.1 (+https://github.com/cverghis)',
    },
  });

  if (!res.ok) {
    console.error(`OCM ${res.status} ${res.statusText}`);
    console.error(await res.text());
    process.exit(1);
  }

  const json: unknown = await res.json();
  const out = join(process.cwd(), 'data', 'ocm-reference.json');
  await writeFile(out, JSON.stringify(json, null, 2));
  console.log(`Wrote ${out}`);
}

main().catch((err: unknown) => {
  console.error('FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
