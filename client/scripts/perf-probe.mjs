// Motion/perf probe: interaction latency, long tasks and frame rate under 4x CPU throttling.
//
//   E2E_PASSWORD=... node scripts/perf-probe.mjs --base http://localhost:5173 --api http://localhost:5000/api \
//     [--scenarios login,dashboard,list] [--list-route /students] [--throttle 4] [--out perf] [--reduced-motion 1]
// --reduced-motion 1 runs the same probe with animations off: the difference is what motion costs.
//
// Per scenario it records (Chrome, CDP Emulation.setCPUThrottlingRate):
//   * click latency  — Event Timing API duration of the click (input delay + processing + next paint), INP-like
//   * route FPS      — frames during the 1 s after a sidebar navigation (page transition) + worst frame gap
//   * scroll FPS     — frames while wheel-scrolling for ~1 s + worst frame gap
//   * long tasks     — count and longest (> 50 ms) during each measured window
// Targets (docs/DESIGN.md#motion): click < 50 ms handling, no long task > 100 ms caused by animation.
// Run it against `npm run build && npx vite preview` for production-like numbers; dev mode is slower.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { apiLogin, assertLocal, newContext, settle } from './lib/session.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), [])
);
const base = args.base || 'http://localhost:5173';
const api = args.api || 'http://localhost:5000/api';
const throttle = Number(args.throttle || 4);
const scenarios = (args.scenarios || 'login,dashboard,list').split(',');
const listRoute = args['list-route'] || '/students';
const out = args.out || 'perf';
assertLocal(base);

const INSTRUMENT = () => {
  window.__perf = { long: [], events: [], frames: [] };
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__perf.long.push({ t: e.startTime, d: e.duration }))).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver((l) =>
    l.getEntries().forEach((e) => window.__perf.events.push({ name: e.name, t: e.startTime, d: e.duration, interactionId: e.interactionId }))
  ).observe({ type: 'event', durationThreshold: 16, buffered: true });
  const tick = (ts) => {
    window.__perf.frames.push(ts);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const windowStats = async (page, from, to) =>
  page.evaluate(
    ({ from: a, to: b }) => {
      const f = window.__perf.frames.filter((t) => t >= a && t <= b);
      const gaps = f.slice(1).map((t, i) => t - f[i]);
      const long = window.__perf.long.filter((e) => e.t >= a - 50 && e.t <= b);
      return {
        fps: f.length > 1 ? Math.round(((f.length - 1) * 1000) / (f[f.length - 1] - f[0])) : 0,
        worstFrameMs: gaps.length ? Math.round(Math.max(...gaps)) : 0,
        longTasks: long.length,
        longestTaskMs: long.length ? Math.round(Math.max(...long.map((e) => e.d))) : 0,
      };
    },
    { from, to }
  );

const now = (page) => page.evaluate(() => performance.now());

async function measureClick(page, locator) {
  const t0 = await now(page);
  await locator.click();
  await page.waitForTimeout(600);
  const t1 = await now(page);
  const evs = await page.evaluate(({ a }) => window.__perf.events.filter((e) => e.t >= a && ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup'].includes(e.name)), { a: t0 });
  const latency = evs.length ? Math.max(...evs.map((e) => e.d)) : 0; // < 16 ms is not reported -> 0
  return { clickLatencyMs: Math.round(latency), ...(await windowStats(page, t0, t1)) };
}

async function measureScroll(page) {
  const t0 = await now(page);
  await page.mouse.move(800, 500);
  for (let i = 0; i < 10; i += 1) {
    await page.mouse.wheel(0, i % 2 ? -400 : 400);
    await page.waitForTimeout(100);
  }
  const t1 = await now(page);
  return windowStats(page, t0, t1);
}

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const sc of scenarios) {
    const role = sc === 'login' ? null : 'admin';
    const session = role ? await apiLogin(api, role) : null;
    const context = await newContext(browser, { theme: 'light', session, reducedMotion: 'reduced-motion' in args ? 'reduce' : 'no-preference' });
    await context.addInitScript(INSTRUMENT);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    const path = sc === 'login' ? '/login' : sc === 'list' ? listRoute : '/';
    await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.waitForTimeout(1500);

    const row = { scenario: sc, path, throttle };
    if (sc === 'login') {
      row.click = await measureClick(page, page.locator('input[type="email"]'));
      row.dropdown = await measureClick(page, page.locator('button[aria-haspopup="menu"]').last());
      const t0 = await now(page);
      await page.waitForTimeout(1000);
      row.idle = await windowStats(page, t0, await now(page)); // petals running
    } else {
      // route transition: navigate via the sidebar
      const target = sc === 'list' ? '/' : listRoute;
      row.route = await measureClick(page, page.locator(`nav a[href="${target}"]`).first());
      row.scroll = await measureScroll(page);
    }
    results.push(row);
    console.log(JSON.stringify(row));
    await context.close();
  }
} finally {
  await browser.close();
}

const md = [
  `| scenario | measure | click latency (ms) | FPS | worst frame (ms) | long tasks | longest task (ms) |`,
  `|---|---|---|---|---|---|---|`,
];
for (const r of results) {
  for (const [k, v] of Object.entries(r)) {
    if (typeof v !== 'object') continue;
    md.push(`| ${r.scenario} (${r.path}) | ${k} | ${v.clickLatencyMs ?? '–'} | ${v.fps} | ${v.worstFrameMs} | ${v.longTasks} | ${v.longestTaskMs} |`);
  }
}
writeFileSync(join(out, 'perf.json'), JSON.stringify(results, null, 2));
writeFileSync(join(out, 'perf.md'), md.join('\n') + '\n');
console.log('\n' + md.join('\n'));
