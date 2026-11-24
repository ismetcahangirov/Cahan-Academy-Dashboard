// Accessibility basics scan (local stack only). Same targets as the colour audit (--routes / --plan / --actions).
//
//   E2E_PASSWORD=... node scripts/a11y-scan.mjs --base http://localhost:5173 --api http://localhost:5000/api \
//     --plan scripts/qa-plan.json [--only <regex>] [--widths 1440,390] [--out a11y]
//
// Per target (light theme, prefers-reduced-motion: reduce) it checks:
//   * name     — every visible button / link / [role=button|tab|menuitem|option] has an accessible name
//                (aria-label, aria-labelledby, text, title or an <img alt>), form fields have a label
//   * focus    — Tab through the first 25 stops: each focused element shows a ring (outline or box-shadow)
//   * trap     — with a dialog open, 25 Tabs never leave [role=dialog]
//   * motion   — with reduced motion, no running animation lasts > 200 ms (one-shot) or loops, except spinners
// Output: <out>/a11y.json + <out>/a11y.txt; exit code 1 when anything fails.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { apiLogin, assertLocal, loadTargets, newContext, runActions, settle } from './lib/session.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), [])
);
const base = args.base || 'http://localhost:5173';
const api = args.api || 'http://localhost:5000/api';
const out = args.out || 'a11y';
const widths = (args.widths || '1440,390').split(',').map(Number);
assertLocal(base);

const scanNames = (page) =>
  page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.01;
    };
    const desc = (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${String(el.className || '').split(/\s+/).slice(0, 3).join('.')} "${(el.outerHTML || '').slice(0, 90)}"`;
    const nameOf = (el) => {
      const lb = el.getAttribute('aria-labelledby');
      const byIds = lb ? lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ') : '';
      const imgAlt = [...el.querySelectorAll('img[alt]')].map((i) => i.alt).join(' ');
      return (el.getAttribute('aria-label') || byIds || el.textContent || el.getAttribute('title') || imgAlt || '').trim();
    };
    const bad = [];
    const sel = 'button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="link"]';
    for (const el of document.querySelectorAll(sel)) {
      if (!vis(el) || el.closest('[aria-hidden="true"], iframe, [data-a11y-ignore]')) continue;
      if (!nameOf(el)) bad.push({ check: 'name', el: desc(el) });
    }
    for (const el of document.querySelectorAll('input, select, textarea')) {
      if (el.type === 'hidden' || !vis(el) || el.closest('[aria-hidden="true"], [data-a11y-ignore]')) continue;
      if (el.classList.contains('sr-only')) continue; // visually hidden radio inside a labelled card
      const labelled = (el.labels && el.labels.length) || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title');
      if (!labelled) bad.push({ check: 'label', el: desc(el) });
    }
    return bad;
  });

async function scanFocus(page, inDialog) {
  const bad = [];
  let escaped = 0;
  const seen = new Set();
  for (let i = 0; i < 25; i += 1) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
      // custom controls draw the ring on a wrapper (e.g. ChoiceList label :has(:focus-visible))
      const wrap = el.closest('label');
      const wrapRing = wrap && getComputedStyle(wrap).outlineStyle !== 'none';
      let o = 1;
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
      return {
        key: el.outerHTML.slice(0, 120),
        ring: ring || wrapRing,
        hidden: o < 0.01 || el.closest('iframe') !== null,
        inDialog: !!el.closest('[role="dialog"]'),
        desc: `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)}"`,
      };
    });
    if (!r) continue;
    if (inDialog && !r.inDialog) escaped += 1;
    if (seen.has(r.key)) continue;
    seen.add(r.key);
    if (!r.ring && !r.hidden) bad.push({ check: 'focus', el: r.desc });
  }
  if (escaped) bad.push({ check: 'trap', el: `${escaped}/25 Tab stops left the open dialog` });
  return bad;
}

const scanMotion = (page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === 'running')
      .map((a) => {
        const t = a.effect?.getTiming?.() || {};
        const target = a.effect?.target;
        return { dur: Number(t.duration) || 0, iter: t.iterations, cls: target ? String(target.className?.baseVal ?? target.className ?? '') : '' };
      })
      .filter((a) => !/\bspin\b|animate-spin|skeleton/.test(a.cls) && (a.iter === Infinity || a.dur > 200))
      .map((a) => ({ check: 'motion', el: `${a.cls.slice(0, 60)} ${a.dur}ms x${a.iter}` }))
  );

mkdirSync(out, { recursive: true });
const targets = await loadTargets(args, api, readFileSync);
const browser = await chromium.launch();
const report = [];
let total = 0;
try {
  for (const target of targets) {
    const session = target.role === 'public' ? null : await apiLogin(api, target.role);
    for (const width of target.widths || widths) {
      const context = await newContext(browser, { theme: 'dark', viewport: { width, height: width < 600 ? 844 : 900 }, session, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const label = `${target.role}:${target.path}${target.name ? ` #${target.name}` : ''} ${width}px`;
      let issues = [];
      try {
        await page.goto(base + target.path, { waitUntil: 'domcontentloaded' });
        await settle(page);
        await runActions(page, target.steps);
        const dialogOpen = await page.locator('[role="dialog"]').count();
        issues = [...(await scanNames(page)), ...(await scanMotion(page)), ...(await scanFocus(page, dialogOpen > 0))];
      } catch (e) {
        issues = [{ check: 'action', el: e.message }];
      }
      const uniq = [...new Map(issues.map((i) => [`${i.check}|${i.el}`, i])).values()];
      total += uniq.length;
      report.push({ target: label, issues: uniq });
      console.log(`${uniq.length ? 'FAIL' : 'ok  '} ${label}${uniq.length ? ` — ${uniq.length} issue(s)` : ''}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
writeFileSync(join(out, 'a11y.json'), JSON.stringify({ total, report }, null, 2));
const lines = [`A11y basics — ${total} issue(s)`, ''];
for (const r of report.filter((x) => x.issues.length)) {
  lines.push(`## ${r.target}`);
  for (const i of r.issues) lines.push(`  - [${i.check}] ${i.el}`);
  lines.push('');
}
writeFileSync(join(out, 'a11y.txt'), lines.join('\n'));
console.log(`\n${total} issue(s). Report: ${join(out, 'a11y.txt')}`);
process.exit(total ? 1 : 0);
