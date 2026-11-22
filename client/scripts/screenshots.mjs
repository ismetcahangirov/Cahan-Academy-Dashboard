// Screenshot routes in light + dark at 1440 and 390 px against the LOCAL stack.
//
//   E2E_PASSWORD=... node scripts/screenshots.mjs --base http://localhost:5173 \
//     --api http://localhost:5000/api --routes "public:/login,admin:/,teacher:/groups" --out ../shots
//
// Files: <out>/<role>-<slug>-<theme>-<width>.png (full page). Look at every one of them.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { apiLogin, assertLocal, newContext, parseRoutes, settle } from './lib/session.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), [])
);
const base = args.base || 'http://localhost:5173';
const api = args.api || 'http://localhost:5000/api';
const out = args.out || 'shots';
const routes = parseRoutes(args.routes || 'public:/login,admin:/');
const themes = (args.themes || 'light,dark').split(',');
const widths = (args.widths || '1440,390').split(',').map(Number);
const fullPage = args.full !== 'false';

assertLocal(base);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const { role, path } of routes) {
    const session = role === 'public' ? null : await apiLogin(api, role);
    for (const theme of themes) {
      for (const width of widths) {
        const context = await newContext(browser, { theme, viewport: { width, height: width < 600 ? 844 : 900 }, session });
        const page = await context.newPage();
        await page.goto(base + path, { waitUntil: 'domcontentloaded' });
        await settle(page);
        const slug = path.replace(/^\//, '').replace(/[/:?=&]+/g, '_') || 'home';
        const file = join(out, `${role}-${slug}-${theme}-${width}.png`);
        await page.screenshot({ path: file, fullPage });
        console.log(file);
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
