// Shared helpers for the Playwright scripts (screenshots, color-audit, perf-probe).
// Logs in through the API once per role and seeds localStorage the way authSlice expects.
// LOCALHOST ONLY: these scripts refuse to run against non-local hosts.

export const ROLES = ['admin', 'teacher', 'student'];

export function assertLocal(url) {
  const host = new URL(url).hostname;
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error(`Refusing to run against ${host}: these scripts are for the local stack only.`);
  }
}

/** Credentials come from env: E2E_PASSWORD (+ optional E2E_<ROLE>_EMAIL). Defaults match server/scripts/e2e-local.mjs. */
export function credentialsFor(role) {
  const defaults = {
    admin: 'admin@e2e.example.com',
    teacher: 'teacher@e2e.example.com',
    student: 'student1@e2e.example.com',
  };
  const email = process.env[`E2E_${role.toUpperCase()}_EMAIL`] || defaults[role];
  const password = process.env[`E2E_${role.toUpperCase()}_PASSWORD`] || process.env.E2E_PASSWORD;
  if (!password) throw new Error('Set E2E_PASSWORD (the password you gave `npm run e2e:local`).');
  return { email, password };
}

const cache = new Map();

export async function apiLogin(apiUrl, role) {
  if (cache.has(role)) return cache.get(role);
  assertLocal(apiUrl);
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentialsFor(role)),
  });
  if (!res.ok) throw new Error(`Login as ${role} failed: HTTP ${res.status}`);
  const body = await res.json();
  const { token, refreshToken, user, ...rest } = body.data;
  const session = { token, refreshToken, user: user || rest };
  cache.set(role, session);
  return session;
}

/** Create a browser context with theme + (optional) logged-in role pre-seeded in localStorage. */
export async function newContext(browser, { theme = 'light', viewport = { width: 1440, height: 900 }, session = null, reducedMotion } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion });
  await context.addInitScript(
    ({ theme: th, session: s }) => {
      try {
        localStorage.setItem('theme', th);
        localStorage.setItem('i18nextLng', localStorage.getItem('i18nextLng') || 'az');
        if (s) {
          localStorage.setItem('user', JSON.stringify(s.user));
          localStorage.setItem('token', s.token);
          if (s.refreshToken) localStorage.setItem('refreshToken', s.refreshToken);
        }
      } catch {
        /* ignore */
      }
    },
    { theme, session }
  );
  return context;
}

/** Parse "role:/path,role:/path" or "/path" lists. Default role for bare paths: admin. */
export function parseRoutes(spec, defaultRole = 'admin') {
  return spec
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(admin|teacher|student|public):(.*)$/);
      return m ? { role: m[1], path: m[2] } : { role: s.startsWith('/login') || s.startsWith('/register') ? 'public' : defaultRole, path: s };
    });
}

export async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // let one-shot entrance animations finish
  await page.waitForTimeout(900);
}

/* ---------------------------------------------------------------- interaction steps + plans
 * Open modals, menus, toasts … before a screenshot / audit.
 *
 *   --actions "click=role=button[name=/Yeni qrup/] ; wait=400"
 *   --plan scripts/qa-plan.json      (array of { role, path, name?, actions?, widths?, themes? })
 *
 * Steps (separated by " ; ", or an array in a plan file):
 *   click=<selector>        Playwright selector (css, text=…, role=button[name="…"], >> chains); first match
 *   dblclick=<selector>     hover=<selector>     focus=<selector>    check=<selector>
 *   fill=<selector>|<text>  press=<key>          (e.g. press=Escape, press=Tab)
 *   select=<selector>|<value>
 *   wait=<ms>               waitfor=<selector>   (visible)
 *   scroll=<selector>       scroll into view
 *   eval=<js expression>    runs in the page
 *   dialog=accept|dismiss   answer the next window.confirm/alert
 * A step prefixed with "?" is optional: if its selector is missing the step is skipped.
 * Path templates resolved from the local API: {exam} {quiz} {course} {student} {teacher} {user}
 * {pendingUser} {schedule} {group} {invitation}.
 */
const STEP = /^(\??)(click|dblclick|hover|focus|check|fill|press|select|wait|waitfor|scroll|eval|dialog)=(.*)$/s;

export function parseActions(spec) {
  if (!spec) return [];
  const list = Array.isArray(spec) ? spec : String(spec).split(/\s+;\s+/);
  return list
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(STEP);
      if (!m) throw new Error(`Unknown action step: ${s}`);
      return { optional: m[1] === '?', op: m[2], arg: m[3] };
    });
}

export async function runActions(page, steps, { log = () => {} } = {}) {
  for (const { optional, op, arg } of steps) {
    // only fill/select carry a "|value"; selectors themselves may contain "|" (regex names)
    const cut = ['fill', 'select'].includes(op) ? arg.lastIndexOf('|') : -1;
    const sel = cut >= 0 ? arg.slice(0, cut) : arg;
    const value = cut >= 0 ? arg.slice(cut + 1) : undefined;
    // first VISIBLE match (desktop and mobile variants of a control often both exist in the DOM)
    const loc = () => page.locator(`${sel} >> visible=true`).first();
    try {
      if (['click', 'dblclick', 'hover', 'focus', 'check', 'fill', 'select', 'waitfor', 'scroll'].includes(op)) {
        await loc().waitFor({ state: 'visible', timeout: optional ? 2500 : 10000 });
      }
      switch (op) {
        case 'click': await loc().click(); break;
        case 'dblclick': await loc().dblclick(); break;
        case 'hover': await loc().hover(); break;
        case 'focus': await loc().focus(); break;
        case 'check': await loc().check(); break;
        case 'fill': await loc().fill(value ?? ''); break;
        case 'select': await loc().selectOption(value ?? ''); break;
        case 'press': await page.keyboard.press(arg); break;
        case 'wait': await page.waitForTimeout(Number(arg)); break;
        case 'waitfor': break;
        case 'scroll': await loc().scrollIntoViewIfNeeded(); break;
        case 'eval': await page.evaluate(arg); break;
        case 'dialog': page.once('dialog', (d) => (arg === 'dismiss' ? d.dismiss() : d.accept())); break;
        default: break;
      }
    } catch (e) {
      if (!optional) throw new Error(`Action ${op}=${arg} failed: ${e.message.split('\n')[0]}`);
      log(`  (skipped optional ${op}=${arg})`);
    }
  }
  // let modal/menu entrance animations finish
  if (steps.length) await page.waitForTimeout(450);
}

/** Look up ids of the seeded entities so plan paths can use {exam}, {student}, … */
export async function resolveIds(apiUrl) {
  const base = apiUrl.replace(/\/$/, '');
  const ids = {};
  const get = async (role, path) => {
    const s = await apiLogin(apiUrl, role);
    const res = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${s.token}` } });
    if (!res.ok) return null;
    return res.json();
  };
  const first = (body) => (body?.data || body?.users || [])[0]?._id;
  const users = await get('admin', '/users?limit=100');
  const list = users?.users || users?.data || [];
  ids.student = list.find((u) => u.email === 'student1@e2e.example.com')?._id;
  ids.teacher = list.find((u) => u.role === 'teacher')?._id;
  ids.user = ids.student;
  ids.pendingUser = list.find((u) => u.status === 'pending')?._id;
  ids.exam = first(await get('admin', '/exams'));
  ids.quiz = first(await get('admin', '/quizzes'));
  ids.course = first(await get('admin', '/courses'));
  ids.group = first(await get('admin', '/groups'));
  ids.schedule = first(await get('admin', '/schedule'));
  ids.invitation = first(await get('admin', '/invitations'));
  return ids;
}

export const fillTemplate = (path, ids) =>
  path.replace(/\{(\w+)\}/g, (_, k) => {
    if (!ids[k]) throw new Error(`No id for {${k}} (is the local stack seeded?)`);
    return ids[k];
  });

/**
 * Build the work list from --plan (JSON file) or --routes (+ --actions applied to every route).
 * Each item: { role, path, name, actions: [steps], themes?, widths? }.
 */
export async function loadTargets(args, apiUrl, readFile) {
  let items;
  if (args.plan) {
    items = JSON.parse(readFile(args.plan, 'utf8')).map((e) => ({ ...e, role: e.role || 'admin' }));
    if (args.only) {
      const re = new RegExp(args.only, 'i');
      items = items.filter((e) => re.test(`${e.role}:${e.path}${e.name ? `#${e.name}` : ''}`));
    }
  } else {
    items = parseRoutes(args.routes || 'public:/login,admin:/').map((r) => ({ ...r, actions: args.actions, name: args.name }));
  }
  const needIds = items.some((e) => /\{\w+\}/.test(e.path));
  const ids = needIds ? await resolveIds(apiUrl) : {};
  return items.map((e) => ({ ...e, path: fillTemplate(e.path, ids), rawPath: e.path, steps: parseActions(e.actions) }));
}

/** File-name slug for a target: role-path[-name] */
export const targetSlug = (t) =>
  `${t.role}-${(t.rawPath || t.path).replace(/^\//, '').replace(/[{}]/g, '').replace(/[/:?=&]+/g, '_') || 'home'}${t.name ? `-${t.name}` : ''}`;
