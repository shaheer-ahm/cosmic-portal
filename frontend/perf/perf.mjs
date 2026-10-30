// Page-load performance test (cold first visit), production build + mocked API.
// Usage: node perf.mjs <label> <outfile.json> [runs]
import { chromium } from 'playwright';
import fs from 'node:fs';
import { setup } from './mocks.mjs';

const [label, outFile, runsArg] = process.argv.slice(2);
const RUNS = Number(runsArg || 5);
const BASE = process.env.PERF_BASE_URL || 'http://localhost:4173';
const API_DELAY_MS = 200; // simulated backend response time per API call

const PAGES = [
  { name: 'Login',        path: '/auth',              ready: 'text=Sign in to access the portal', loggedIn: false },
  { name: 'Dashboard',    path: '/dashboard',         ready: 'text=ORD-5' },
  { name: 'Orders',       path: '/orders',            ready: 'text=ORD-12' },
  { name: 'New order',    path: '/orders/new',        ready: 'text=2 active carton types' },
  { name: 'Order result', path: '/orders/1',          ready: 'text=Packing Plan' },
  { name: 'Integration',  path: '/integration',       ready: 'main.cf-integration' },
  { name: 'Profiles',     path: '/profiles',          ready: 'text=User Access Management' },
  { name: '3D box view',  path: '/orders/1/boxes/box-2', ready: 'canvas' },
];

const PROFILES = {
  // Lighthouse's default mobile settings
  mobile:  { latency: 150, down: 1.6 * 1024 * 1024 / 8, up: 750 * 1024 / 8, cpu: 4, viewport: { width: 390, height: 844 } },
  desktop: { latency: 40,  down: 10 * 1024 * 1024 / 8,  up: 5 * 1024 * 1024 / 8, cpu: 1, viewport: { width: 1366, height: 900 } },
};

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const results = { label, apiDelayMs: API_DELAY_MS, runs: RUNS, profiles: {} };

for (const [profileName, prof] of Object.entries(PROFILES)) {
  results.profiles[profileName] = {};
  for (const pg of PAGES) {
    const samples = [];
    for (let run = 0; run < RUNS; run++) {
      const ctx = await browser.newContext({ viewport: prof.viewport });
      const page = await ctx.newPage();
      const apiCalls = [];
      if (pg.loggedIn === false) {
        await page.route('**/api/v1/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
      } else {
        await setup(ctx, page);
      }
      // Wrap the mocked API with a delay and count calls.
      await page.route('**/api/v1/**', async (route) => {
        apiCalls.push(new URL(route.request().url()).pathname);
        await new Promise(r => setTimeout(r, API_DELAY_MS));
        await route.fallback();
      });
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: prof.latency, downloadThroughput: prof.down, uploadThroughput: prof.up });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: prof.cpu });
      await page.addInitScript(() => {
        window.__lcp = 0;
        new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__lcp = e.startTime; })
          .observe({ type: 'largest-contentful-paint', buffered: true });
      });

      await page.goto(BASE + pg.path, { waitUntil: 'commit' });
      await page.waitForSelector(pg.ready, { timeout: 90000 });
      // Record "ready" now, then wait two frames so the browser has finished
      // recording paint timings before we read them (otherwise first paint
      // can come back empty when content appears in the very first paint).
      const readyAt = await page.evaluate(() => performance.now());
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const m = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null;
        const res = performance.getEntriesByType('resource');
        const js = res.filter(r => r.initiatorType === 'script' || r.name.endsWith('.js'));
        const css = res.filter(r => r.name.endsWith('.css'));
        return {
          ready: performance.now(),
          fcp, lcp: window.__lcp || null,
          domContentLoaded: nav ? nav.domContentLoadedEventEnd : null,
          jsKB: js.reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0) / 1024,
          cssKB: css.reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0) / 1024,
          jsFiles: js.length,
        };
      });
      m.ready = readyAt;
      m.apiCalls = apiCalls.length;
      samples.push(m);
      await ctx.close();
    }
    const summary = {};
    for (const key of Object.keys(samples[0])) {
      const vals = samples.map(s => s[key]).filter(v => v != null);
      summary[key] = vals.length ? Math.round(median(vals) * 10) / 10 : null;
    }
    results.profiles[profileName][pg.name] = summary;
    console.log(`${profileName.padEnd(7)} ${pg.name.padEnd(13)} ready ${String(summary.ready).padStart(7)} ms  FCP ${String(summary.fcp).padStart(7)}  JS ${String(summary.jsKB).padStart(6)} KB  API ${summary.apiCalls}`);
  }
}
fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
await browser.close();
