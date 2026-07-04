// True union merge of monorepo coverage using istanbul-lib-coverage.
// Merges per-line/statement/branch hit counts across ALL reports, so a file
// covered by both unit AND integration gets the UNION of covered lines.
import istanbulLibCoverage from 'istanbul-lib-coverage';
const { createCoverageMap } = istanbulLibCoverage;
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const metrics = ['lines', 'statements', 'branches', 'functions'];

const sources = [
  { name: 'backend (unit)', file: 'apps/backend/coverage/coverage-final.json' },
  { name: 'backend (integration)', file: 'apps/backend/coverage/integration/coverage-final.json' },
  { name: 'backend (models)', file: 'apps/backend/coverage/models/coverage-final.json' },
  { name: 'frontend', file: 'apps/frontend/coverage/coverage-final.json' },
  { name: 'shared-utils', file: 'packages/shared-utils/coverage/coverage-final.json' }
];

const mergedMap = createCoverageMap();
const perProject = [];

for (const s of sources) {
  const p = resolve(root, s.file);
  if (!existsSync(p)) {
    console.log(`skip ${s.name} (no coverage-final.json)`);
    continue;
  }
  const data = JSON.parse(readFileSync(p, 'utf8'));
  mergedMap.merge(data);

  const pm = createCoverageMap();
  pm.merge(data);
  const ps = pm.getCoverageSummary();
  perProject.push({ name: s.name, lines: ps.lines.pct, statements: ps.statements.pct, branches: ps.branches.pct, functions: ps.functions.pct });
}

const merged = mergedMap.getCoverageSummary();
const fmt = (n) => `${(+n).toFixed(2)}%`.padStart(9);
console.log('\nMonorepo coverage merge (Istanbul true union)\n');
console.log('project'.padEnd(26), ...metrics.map((m) => m.padStart(9)));
for (const r of perProject) console.log(r.name.padEnd(26), ...metrics.map((m) => fmt(r[m])));
console.log('-'.repeat(62));
console.log('MERGED (union)'.padEnd(26), ...metrics.map((m) => fmt(merged[m].pct)));
console.log(`\n${mergedMap.files().length} unique source files.`);

const out = resolve(root, 'coverage/monorepo-coverage-summary.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({
  total: Object.fromEntries(metrics.map((m) => [m, { total: merged[m].total, covered: merged[m].covered, pct: merged[m].pct }]))
}), null, 2);
console.log(`Wrote ${out}`);

// Merged coverage gate — fails (exit 1) if the monorepo total drops below the floor.
// Ratchet upward as coverage improves (update GATE values below).
const GATE = { statements: 80, branches: 70 };
const gateFailures = [];
for (const [m, min] of Object.entries(GATE)) {
  if (merged[m].pct < min) gateFailures.push(`  ${m}: ${merged[m].pct.toFixed(2)}% < ${min}%`);
}
if (gateFailures.length) {
  console.error('\n❌ Merged coverage gate FAILED:\n' + gateFailures.join('\n'));
  process.exit(1);
}
console.log(`\n✅ Merged coverage gate passed (statements ≥ ${GATE.statements}%, branches ≥ ${GATE.branches}%).`);
