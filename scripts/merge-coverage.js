// Aggregates each workspace's coverage-summary.json into a monorepo-wide total.
// No external deps — just sums covered/total per metric across projects.
// Run after generating coverage in each app: `npm run coverage:merge`
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const metrics = ['lines', 'statements', 'branches', 'functions'];

const sources = [
  { name: 'backend (unit)', file: 'apps/backend/coverage/coverage-summary.json' },
  { name: 'backend (integration)', file: 'apps/backend/coverage/integration/coverage-summary.json' },
  { name: 'frontend', file: 'apps/frontend/coverage/coverage-summary.json' },
  { name: 'shared-utils', file: 'packages/shared-utils/coverage/coverage-summary.json' }
];

const acc = Object.fromEntries(metrics.map((m) => [m, { total: 0, covered: 0 }]));
const rows = [];

for (const s of sources) {
  const p = resolve(root, s.file);
  if (!existsSync(p)) continue;
  const total = JSON.parse(readFileSync(p, 'utf8')).total;
  const row = { name: s.name };
  for (const m of metrics) {
    if (total[m] && total[m].total > 0) {
      acc[m].total += total[m].total;
      acc[m].covered += total[m].covered;
      row[m] = total[m].pct;
    }
  }
  rows.push(row);
}

const merged = { total: {} };
for (const m of metrics) {
  const { total, covered } = acc[m];
  merged.total[m] = { total, covered, pct: total ? +((covered / total) * 100).toFixed(2) : 0 };
}

const fmt = (n) => `${n}%`.padEnd(13);
console.log('\nMonorepo coverage merge\n');
console.log('project'.padEnd(26), ...metrics.map((m) => m.padEnd(13)));
for (const r of rows) console.log(r.name.padEnd(26), ...metrics.map((m) => fmt(r[m] ?? '-')));
console.log('-'.repeat(78));
console.log('MONOREPO TOTAL'.padEnd(26), ...metrics.map((m) => fmt(merged.total[m].pct)));

const out = resolve(root, 'coverage/monorepo-coverage-summary.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(merged, null, 2));
console.log(`\nWrote ${out}`);
