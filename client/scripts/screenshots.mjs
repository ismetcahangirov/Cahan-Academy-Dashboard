// Screenshot routes in light + dark at 1440 and 390 px against the LOCAL stack.
//
//   E2E_PASSWORD=... node scripts/screenshots.mjs --base http://localhost:5173 \
//     --api http://localhost:5000/api --routes "public:/login,admin:/,teacher:/groups" --out ../shots
//
// Files: <out>/<role>-<slug>[-<name>]-<theme>-<width>.png (full page). Look at every one of them.
//
// Interactive states (modal open, menu open, toast …): --actions "click=role=button[name=/Yeni/] ; wait=300"
// applies the steps after the page settles; --name labels the file. Or pass a plan with many targets:
//   node scripts/screenshots.mjs --plan scripts/qa-plan.json [--only "teacher:/groups"] --out ../shots/qa
// Step syntax and path templates ({exam}, {student} …): see scripts/lib/session.mjs.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { apiLogin, assertLocal, loadTargets, newContext, runActions, settle, targetSlug } from './lib/session.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), [])
);
const base = args.base || 'http://localhost:5173';
const api = args.api || 'http://localhost:5000/api';
const out = args.out || 'shots';
const themes = (args.themes || 'dark').split(',');
const widths = (args.widths || '1440,390').split(',').map(Number);
const fullPage = args.full !== 'false';

assertLocal(base);
mkdirSync(out, { recursive: true });
const targets = await loadTargets(args, api, readFileSync);
const browser = await chromium.launch();
let failed = 0;
try {
  for (const target of targets) {
    const { role, path, steps } = target;
    const session = role === 'public' ? null : await apiLogin(api, role);
    for (const theme of target.themes || themes) {
      for (const width of target.widths || widths) {
        const context = await newContext(browser, { theme, viewport: { width, height: width < 600 ? 844 : 900 }, session });
        const page = await context.newPage();
        const file = join(out, `${targetSlug(target)}-${theme}-${width}.png`);
        try {
          await page.goto(base + path, { waitUntil: 'domcontentloaded' });
          await settle(page);
          await runActions(page, steps, { log: console.log });
          // a modal/sheet is the subject: capture the viewport, not the page behind it
          await page.screenshot({ path: file, fullPage: fullPage && !steps.length });
          console.log(file);
        } catch (e) {
          failed += 1;
          console.log(`FAILED ${file}: ${e.message}`);
        }
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
