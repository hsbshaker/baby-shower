/**
 * One-time (or manual re-run) CLI import of the Amazon registry.
 *
 * Loads .env.local (a tiny manual parser — no dotenv dependency needed),
 * then calls the same runAmazonSync() the scheduled /api/sync route and
 * GitHub Action use, and prints the result.
 *
 * Usage: npm run import:amazon
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    console.warn(`import-amazon: no .env.local found at ${envPath}, using existing environment only`);
    return;
  }

  const contents = readFileSync(envPath, 'utf-8');
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // Strip matching surrounding quotes, if any.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();

  // Imported after env vars are loaded so lib/supabase.ts sees them.
  const { runAmazonSync } = await import('../lib/sync');

  console.log('import-amazon: starting sync…');
  const result = await runAmazonSync();

  const rows = [
    ['status', result.status],
    ['itemsSeen', String(result.itemsSeen)],
    ['itemsAdded', String(result.itemsAdded)],
    ['itemsUpdated', String(result.itemsUpdated)],
    ['message', result.message],
  ];
  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  console.log('');
  for (const [label, value] of rows) {
    console.log(`  ${label.padEnd(labelWidth)}  ${value}`);
  }
  console.log('');

  if (result.status === 'error') {
    console.error('import-amazon: sync failed');
    process.exit(1);
  }

  console.log('import-amazon: done');
}

main().catch((err) => {
  console.error('import-amazon: unexpected error', err);
  process.exit(1);
});
