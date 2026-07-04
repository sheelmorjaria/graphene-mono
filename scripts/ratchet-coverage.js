// Bumps coverage thresholds up to current coverage (minus a small headroom),
// by rewriting the `// @ratchet-begin ... // @ratchet-end` block in each config.
// Opt-in: run manually/CI after coverage improves. It can only RAISE the floor
// (it recomputes from current coverage), never silently lower it below current.
// Usage: generate coverage first, then `npm run coverage:ratchet`.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const metrics = ['lines', 'statements', 'branches', 'functions'];
// Extra headroom below current % so day-to-day fluctuation doesn't trip CI.
const headroom = { lines: 1, statements: 1, branches: 2, functions: 2 };

const projects = [
  { config: 'apps/backend/vitest.config.unit.js', summary: 'apps/backend/coverage/coverage-summary.json' },
  { config: 'apps/frontend/vitest.config.js', summary: 'apps/frontend/coverage/coverage-summary.json' },
  { config: 'packages/shared-utils/vitest.config.ts', summary: 'packages/shared-utils/coverage/coverage-summary.json' },
  { config: 'apps/backend/vitest.integration.config.js', summary: 'apps/backend/coverage/integration/coverage-summary.json' }
];

for (const p of projects) {
  const cfgPath = resolve(root, p.config);
  const sumPath = resolve(root, p.summary);
  if (!existsSync(sumPath)) {
    console.log(`skip ${p.config} (no coverage-summary.json — run coverage first)`);
    continue;
  }
  let cfg = readFileSync(cfgPath, 'utf8');
  if (!/@ratchet-begin[\s\S]*?@ratchet-end/.test(cfg)) {
    console.log(`skip ${p.config} (no @ratchet markers)`);
    continue;
  }
  const t = JSON.parse(readFileSync(sumPath, 'utf8')).total;
  const th = {};
  for (const m of metrics) {
    // Never lower a threshold — ratchet only goes up (prevents stale summaries
    // from destroying gates). Read the current value from the config.
    const cur = cfg.match(new RegExp(`${m}:\\s*(\\d+)`));
    const curVal = cur ? parseInt(cur[1], 10) : 0;
    th[m] = Math.max(curVal, Math.floor(t[m]?.pct ?? 0) - (headroom[m] ?? 1));
  }

  const replacement =
    `      // @ratchet-begin (auto-updated by \`npm run coverage:ratchet\` — do not edit manually)\n` +
    `      thresholds: { lines: ${th.lines}, branches: ${th.branches}, functions: ${th.functions}, statements: ${th.statements} }\n` +
    `      // @ratchet-end`;
  cfg = cfg.replace(/^[ \t]*\/\/\s*@ratchet-begin[\s\S]*?\/\/\s*@ratchet-end/m, replacement);
  writeFileSync(cfgPath, cfg);
  console.log(`ratcheted ${p.config} -> lines ${th.lines}, statements ${th.statements}, branches ${th.branches}, functions ${th.functions}`);
}
console.log('\nDone. Review the diff, then commit.');
