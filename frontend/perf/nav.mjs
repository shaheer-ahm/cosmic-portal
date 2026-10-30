// In-app navigation timing: open Dashboard, wait, then tap through pages.
import { chromium } from 'playwright';
import { setup } from './mocks.mjs';
const median = xs => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const [label, base] of (process.env.NAV_TARGETS || 'current=http://localhost:4173').split(',').map(t => t.split('='))) {
  const times = { 'Dashboard -> Orders': [], 'Orders -> New order': [] };
  for (let run = 0; run < 5; run++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
    await setup(ctx, p);
    await p.route('**/api/v1/**', async r => { await new Promise(x => setTimeout(x, 200)); await r.fallback(); });
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.goto(base + '/dashboard'); await p.waitForSelector('text=ORD-5', { timeout: 60000 });
    await p.waitForTimeout(6000); // user reads the dashboard; background prefetch happens here
    let t = Date.now(); await p.locator('nav.cf-bottom-nav >> text=Orders').click(); await p.waitForSelector('text=ORD-12'); times['Dashboard -> Orders'].push(Date.now() - t);
    t = Date.now(); await p.locator('nav.cf-bottom-nav >> text=New order').click(); await p.waitForSelector('text=2 active carton types'); times['Orders -> New order'].push(Date.now() - t);
    await ctx.close();
  }
  for (const [k, v] of Object.entries(times)) console.log(label.padEnd(7), k.padEnd(22), median(v), 'ms');
}
await b.close();
