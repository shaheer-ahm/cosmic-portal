// Turn perf.mjs results into Markdown tables for documentation.
//
//   node perf/compare.mjs before.json              -> one run's results
//   node perf/compare.mjs before.json after.json   -> before vs after, with % change
import fs from 'node:fs';

const [firstFile, secondFile] = process.argv.slice(2);
if (!firstFile) {
  console.error('Usage: node perf/compare.mjs <results.json> [other-results.json]');
  process.exit(1);
}

const first = JSON.parse(fs.readFileSync(firstFile, 'utf8'));
const second = secondFile ? JSON.parse(fs.readFileSync(secondFile, 'utf8')) : null;
const sec = (ms) => (ms == null ? '-' : `${(ms / 1000).toFixed(2)} s`);
const kb = (v) => (v == null ? '-' : `${Math.round(v)} KB`);

for (const profile of Object.keys(first.profiles)) {
  console.log(`\n### ${profile[0].toUpperCase()}${profile.slice(1)}\n`);
  if (!second) {
    console.log('| Page | Ready | First paint | JS downloaded | API calls |');
    console.log('|---|---|---|---|---|');
    for (const [page, m] of Object.entries(first.profiles[profile])) {
      console.log(`| ${page} | ${sec(m.ready)} | ${sec(m.fcp)} | ${kb(m.jsKB)} | ${m.apiCalls} |`);
    }
  } else {
    console.log(`| Page | Ready (${first.label}) | Ready (${second.label}) | Change | First paint | JS downloaded | API calls |`);
    console.log('|---|---|---|---|---|---|---|');
    for (const [page, a] of Object.entries(first.profiles[profile])) {
      const b = second.profiles[profile]?.[page];
      if (!b) continue;
      const change = Math.round((100 * (b.ready - a.ready)) / a.ready);
      console.log(
        `| ${page} | ${sec(a.ready)} | ${sec(b.ready)} | ${change > 0 ? '+' : ''}${change}% | ` +
          `${sec(a.fcp)} → ${sec(b.fcp)} | ${kb(a.jsKB)} → ${kb(b.jsKB)} | ${a.apiCalls} → ${b.apiCalls} |`,
      );
    }
  }
}
console.log(
  `\n${first.runs} runs per page (median), each API call delayed ${first.apiDelayMs} ms. ` +
    'Mobile = slow 4G + 4× slower CPU (Lighthouse mobile defaults); desktop = 10 Mbps.',
);
