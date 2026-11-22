// Motion/perf probe: interaction latency, long tasks and frame rate under 4x CPU throttling.
//
//   E2E_PASSWORD=... node scripts/perf-probe.mjs --base http://localhost:5173 --api http://localhost:5000/api \
//     [--scenarios login,dashboard,list] [--list-route /students] [--throttle 4] [--out perf] [--reduced-motion 1]
// --reduced-motion 1 runs the same probe with animations off: the difference is what motion costs.
//
// Scenarios (comma separated; ":role" picks who is logged in, default admin):
//   login                 focus the e-mail field, open the language menu, 1 s idle (petals running)
//   dashboard[:role]      open "/", then navigate to --list-route through the sidebar, then scroll
//   list[:role]           open --list-route, navigate to "/" through the sidebar, then scroll
//   route:<role>:<path>   open <path>, navigate to "/" through the sidebar, scroll (any page)
//   take-exam             student: open the first exam's take page, pick an answer, type, scroll, 2 s idle (clock ticking)
//   e.g. --scenarios "login,dashboard:admin,dashboard:teacher,dashboard:student,list:admin,take-exam" --list-route /groups
//
// Per scenario it records (Chrome, CDP Emulation.setCPUThrottlingRate):
//   * click latency  — Event Timing API duration of the click (input delay + processing + next paint), INP-like
//   * route FPS      — frames during the 600 ms after a sidebar navigation (page transition) + worst frame gap
//   * scroll FPS     — frames while wheel-scrolling for ~1 s + worst frame gap
//   * long tasks     — count and longest (> 50 ms) during each measured window
//   * three.js       — whether the lazy three.js / petal chunk was requested (must be "no" outside auth pages)
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
const scenarios = (args.scenarios || 'login,dashboard,list').split(',').map((s) => s.trim()).filter(Boolean);
const listRoute = args['list-route'] || '/students';
const out = args.out || 'perf';
const reducedMotion = 'reduced-motion' in args && args['reduced-motion'] !== '0';
assertLocal(base);

// chunks that belong to the auth-page 3D scene only
const THREE_CHUNK = /three|PetalField|EdelweissPetals/i;

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

const INPUT_EVENTS = ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'keypress', 'input'];

async function measure(page, action, settleMs = 600) {
  const t0 = await now(page);
  await action();
  await page.waitForTimeout(settleMs);
  const t1 = await now(page);
  const evs = await page.evaluate(({ a, names }) => window.__perf.events.filter((e) => e.t >= a && names.includes(e.name)), { a: t0, names: INPUT_EVENTS });
  const latency = evs.length ? Math.max(...evs.map((e) => e.d)) : 0; // < 16 ms is not reported -> 0
  return { clickLatencyMs: Math.round(latency), ...(await windowStats(page, t0, t1)) };
}

const measureClick = (page, locator) => measure(page, () => locator.click());

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

async function firstExamId(session) {
  const res = await fetch(`${api.replace(/\/$/, '')}/exams`, { headers: { Authorization: `Bearer ${session.token}` } });
  const body = await res.json();
  const exam = (body.data || []).find((e) => (e.questions?.length || e.questionCount) > 0) || (body.data || [])[0];
  if (!exam) throw new Error('No exam visible to the student: seed the local stack first');
  return exam._id;
}

function parseScenario(sc) {
  const [kind, role, ...rest] = sc.split(':');
  if (kind === 'login') return { kind, role: null, path: '/login' };
  if (kind === 'take-exam') return { kind, role: 'student', path: null };
  if (kind === 'route') return { kind, role: role || 'admin', path: rest.join(':') || '/' };
  if (kind === 'list') return { kind, role: role || 'admin', path: listRoute };
  return { kind: 'dashboard', role: role || 'admin', path: '/' };
}

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const sc of scenarios) {
    const { kind, role, path: scPath } = parseScenario(sc);
    const session = role ? await apiLogin(api, role) : null;
    const path = kind === 'take-exam' ? `/exams/${await firstExamId(session)}/take` : scPath;
    const context = await newContext(browser, { theme: 'light', session, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
    await context.addInitScript(INSTRUMENT);
    const chunks = new Set();
    context.on('request', (r) => {
      const file = r.url().split('?')[0].split('/').pop();
      if (r.resourceType() === 'script' && THREE_CHUNK.test(file)) chunks.add(file);
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.waitForTimeout(1500);

    const row = { scenario: sc, role: role || 'public', path, throttle };
    if (kind === 'login') {
      row.click = await measureClick(page, page.locator('input[type="email"]'));
      row.dropdown = await measureClick(page, page.locator('button[aria-haspopup="menu"]').last());
      const t0 = await now(page);
      await page.waitForTimeout(1000);
      row.idle = await windowStats(page, t0, await now(page)); // petals running
    } else if (kind === 'take-exam') {
      row.choice = await measureClick(page, page.locator('[role="radiogroup"] label').first());
      const ta = page.locator('textarea').first();
      if (await ta.count()) {
        await ta.click();
        row.typing = await measure(page, () => ta.pressSequentially('let is block scoped', { delay: 30 }), 300);
      }
      row.scroll = await measureScroll(page);
      const t0 = await now(page);
      await page.waitForTimeout(2000);
      row.idle = await windowStats(page, t0, await now(page)); // exam clock ticking
    } else {
      // route transition: navigate via the sidebar
      const target = kind === 'dashboard' ? listRoute : '/';
      row.route = await measureClick(page, page.locator(`nav a[href="${target}"]`).first());
      row.scroll = await measureScroll(page);
    }
    row.threeChunk = chunks.size ? [...chunks].join(' ') : 'no';
    results.push(row);
    console.log(JSON.stringify(row));
    await context.close();
  }
} finally {
  await browser.close();
}

const md = [
  `| scenario | measure | click latency (ms) | FPS | worst frame (ms) | long tasks | longest task (ms) | three.js chunk |`,
  `|---|---|---|---|---|---|---|---|`,
];
for (const r of results) {
  for (const [k, v] of Object.entries(r)) {
    if (!v || typeof v !== 'object') continue;
    md.push(`| ${r.scenario} (${r.path}) | ${k} | ${v.clickLatencyMs ?? '–'} | ${v.fps} | ${v.worstFrameMs} | ${v.longTasks} | ${v.longestTaskMs} | ${r.threeChunk} |`);
  }
}
writeFileSync(join(out, 'perf.json'), JSON.stringify(results, null, 2));
writeFileSync(join(out, 'perf.md'), md.join('\n') + '\n');
console.log('\n' + md.join('\n'));
