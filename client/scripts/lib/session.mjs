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
