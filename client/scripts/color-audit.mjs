// Colour-law audit (runtime). See docs/DESIGN.md#colour-law.
//
// Every rendered colour must lie on the polyline  #FFFFFF -> #5C000E -> #000000  (±4 per channel).
// For each route x theme x width this script walks every element (and ::before / ::after,
// ::placeholder, ::selection), reads the computed colours that paint pixels — color,
// background-color, border colours, outline, text-decoration, box-shadow, SVG fill/stroke,
// gradient stops, scrollbar-color — composites alpha (and element opacity) over the actual
// backdrop (ancestor background colours), and checks the result against the polyline.
// It also samples the pixels of every raster ornament (<img> and CSS url() backgrounds; user
// photos marked data-user-image are exempt) and tabs through the page to check focus rings.
//
// Usage (local stack only):
//   E2E_PASSWORD=... node scripts/color-audit.mjs --base http://localhost:5173 --api http://localhost:5000/api \
//     --routes "public:/login,admin:/,teacher:/groups" [--themes light,dark] [--widths 1440,390] [--out color-audit] [--scope "main"]
// Output: <out>/color-audit.json + <out>/color-audit.txt; exit code 1 when anything violates the law.
// Escape hatch (needs a reason in review): data-color-audit-ignore on an element skips its subtree.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { apiLogin, assertLocal, newContext, parseRoutes, settle } from './lib/session.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), [])
);
const base = args.base || 'http://localhost:5173';
const api = args.api || 'http://localhost:5000/api';
const out = args.out || 'color-audit';
const routes = parseRoutes(args.routes || 'public:/login,admin:/');
const themes = (args.themes || 'light,dark').split(',');
const widths = (args.widths || '1440,390').split(',').map(Number);
const TOL = Number(args.tolerance || 4);
// --scope "aside, header" restricts the element walk to matching subtrees (e.g. audit only the app shell)
const RASTER_MAX_OFF = Number(args['raster-max-off'] || 0.002); // fraction of opaque-ish pixels allowed off-law (codec noise)

assertLocal(base);

/* ---------------------------------------------------------------- in-page auditor */
async function auditPage(page, tol, scope) {
  return page.evaluate(async ({ TOL, SCOPE }) => {
    const WINE = [92, 0, 14];
    const onLaw = (c) => {
      // min over the two segments of the max-channel distance to the closest sampled point
      let best = Infinity;
      for (const [p0, p1] of [[[255, 255, 255], WINE], [WINE, [0, 0, 0]]]) {
        for (let i = 0; i <= 512; i += 1) {
          const t = i / 512;
          const d = Math.max(
            Math.abs(c[0] - (p0[0] + (p1[0] - p0[0]) * t)),
            Math.abs(c[1] - (p0[1] + (p1[1] - p0[1]) * t)),
            Math.abs(c[2] - (p0[2] + (p1[2] - p0[2]) * t))
          );
          if (d < best) best = d;
        }
      }
      return best <= TOL ? true : best;
    };

    // CSS colour string -> [r,g,b,a] in sRGB, via two canvas fills (over white / over black)
    const cv = document.createElement('canvas');
    cv.width = 2;
    cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    const cache = new Map();
    const parse = (str) => {
      if (!str || str === 'none' || str === 'transparent' || str.startsWith('url(')) return null;
      if (cache.has(str)) return cache.get(str);
      cx.clearRect(0, 0, 2, 1);
      cx.fillStyle = '#ffffff';
      cx.fillRect(0, 0, 1, 1);
      cx.fillStyle = '#000000';
      cx.fillRect(1, 0, 1, 1);
      cx.fillStyle = '#123456';
      cx.fillStyle = str;
      if (cx.fillStyle === '#123456' && str.toLowerCase() !== '#123456') {
        cache.set(str, null);
        return null;
      }
      cx.fillRect(0, 0, 2, 1);
      const d = cx.getImageData(0, 0, 2, 1).data;
      const w = [d[0], d[1], d[2]];
      const b = [d[4], d[5], d[6]];
      const a = 1 - (w[0] - b[0] + w[1] - b[1] + w[2] - b[2]) / (3 * 255);
      const rgb = a > 0.004 ? b.map((v) => Math.min(255, v / a)) : [0, 0, 0];
      const res = [...rgb, Math.max(0, Math.min(1, a))];
      cache.set(str, res);
      return res;
    };
    const over = (c, bg, extra = 1) => {
      const a = c[3] * extra;
      return [0, 1, 2].map((i) => c[i] * a + bg[i] * (1 - a));
    };

    const skip = (el) => el.closest('[data-user-image], [data-color-audit-ignore], iframe');
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      const cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const effOpacity = (el) => {
      let o = 1;
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
      return o;
    };
    const bdCache = new Map();
    const backdrop = (el) => {
      if (!el) return [255, 255, 255];
      if (bdCache.has(el)) return bdCache.get(el);
      const parent = el.parentElement;
      const below = parent ? backdrop(parent) : [255, 255, 255];
      const bg = parse(getComputedStyle(el).backgroundColor);
      const res = bg && bg[3] > 0 ? over(bg, below) : below;
      bdCache.set(el, res);
      return res;
    };
    const short = (el) => {
      const parts = [];
      for (let n = el; n && n.nodeType === 1 && parts.length < 4; n = n.parentElement) {
        let s = n.tagName.toLowerCase();
        if (n.id) s += `#${n.id}`;
        const cls = typeof n.className === 'string' ? n.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
        if (cls) s += `.${cls}`;
        parts.unshift(s);
      }
      return parts.join(' > ');
    };
    const colorsIn = (s) => (s && s !== 'none' ? s.match(/(rgba?|oklab|oklch|lab|lch|hsla?|color)\([^()]*(\([^()]*\)[^()]*)*\)|#[0-9a-f]{3,8}\b/gi) || [] : []);
    const urlsIn = (s) => (s && s !== 'none' ? [...s.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]) : []);

    const violations = [];
    const rasters = new Set();
    let checks = 0;
    const check = (el, prop, raw, c, bg, extra) => {
      if (!c || c[3] * extra < 0.01) return;
      checks += 1;
      const final = over(c, bg, extra).map((v) => Math.round(v));
      const ok = onLaw(final);
      if (ok !== true) violations.push({ selector: short(el), prop, value: raw, rendered: `rgb(${final.join(', ')})`, distance: Math.round(ok) });
    };

    const SVG_SHAPES = new Set(['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'text', 'tspan']);
    const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());

    const auditStyle = (el, cs, pseudo, ownBg, outerBg, op) => {
      const tag = pseudo ? `${pseudo}` : '';
      const bgc = parse(cs.backgroundColor);
      if (bgc && bgc[3] > 0) check(el, `${tag}background-color`, cs.backgroundColor, bgc, outerBg, op);
      const surface = bgc && bgc[3] > 0 ? over(bgc, outerBg) : outerBg;
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        if (cs[`border${side}Style`] !== 'none' && parseFloat(cs[`border${side}Width`]) > 0) {
          check(el, `${tag}border-${side.toLowerCase()}-color`, cs[`border${side}Color`], parse(cs[`border${side}Color`]), surface, op);
        }
      }
      if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) {
        check(el, `${tag}outline-color`, cs.outlineColor, parse(cs.outlineColor), outerBg, op);
      }
      for (const raw of colorsIn(cs.boxShadow)) check(el, `${tag}box-shadow`, raw, parse(raw), outerBg, op);
      for (const raw of colorsIn(cs.backgroundImage)) check(el, `${tag}background-image (gradient stop)`, raw, parse(raw), outerBg, op);
      for (const u of urlsIn(cs.backgroundImage)) rasters.add(new URL(u, location.href).href);
      if (!pseudo && (hasOwnText(el) || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName))) {
        check(el, 'color', cs.color, parse(cs.color), surface, op);
        if (cs.textDecorationLine !== 'none') {
          check(el, 'text-decoration-color', cs.textDecorationColor, parse(cs.textDecorationColor), surface, op);
        }
      }
      if (pseudo && cs.content !== 'none' && cs.content !== 'normal' && cs.content !== '""') {
        check(el, `${tag}color`, cs.color, parse(cs.color), surface, op);
      }
      if (!pseudo && el instanceof SVGElement && SVG_SHAPES.has(el.tagName.toLowerCase())) {
        if (cs.fill && !cs.fill.startsWith('url') && cs.fill !== 'none') check(el, 'fill', cs.fill, parse(cs.fill), outerBg, op * Number(cs.fillOpacity));
        if (cs.stroke && !cs.stroke.startsWith('url') && cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0) {
          check(el, 'stroke', cs.stroke, parse(cs.stroke), outerBg, op * Number(cs.strokeOpacity));
        }
      }
    };

    for (const el of document.querySelectorAll('body, body *')) {
      if (skip(el) || !visible(el)) continue;
      if (SCOPE && !el.closest(SCOPE)) continue;
      const op = effOpacity(el);
      if (op < 0.01) continue;
      const cs = getComputedStyle(el);
      const outerBg = backdrop(el.parentElement);
      auditStyle(el, cs, null, null, outerBg, op);
      const own = backdrop(el);
      for (const p of ['::before', '::after']) {
        const ps = getComputedStyle(el, p);
        if (ps.content && ps.content !== 'none' && ps.content !== 'normal') auditStyle(el, ps, p, null, own, op);
      }
      if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.placeholder) {
        const ph = getComputedStyle(el, '::placeholder');
        check(el, '::placeholder color', ph.color, parse(ph.color), own, op);
      }
      if (el.tagName === 'IMG' && el.complete && el.naturalWidth > 0 && el.currentSrc) rasters.add(el.currentSrc);
    }

    // page-level: selection + scrollbar
    const sel = getComputedStyle(document.body, '::selection');
    const selBg = parse(sel.backgroundColor);
    if (selBg && selBg[3] > 0) {
      check(document.body, '::selection background', sel.backgroundColor, selBg, backdrop(document.body), 1);
      check(document.body, '::selection color', sel.color, parse(sel.color), over(selBg, backdrop(document.body)), 1);
    }
    for (const raw of colorsIn(getComputedStyle(document.documentElement).scrollbarColor)) {
      check(document.documentElement, 'scrollbar-color', raw, parse(raw), backdrop(document.body), 1);
    }

    // raster ornaments: every pixel with alpha >= 64 must itself be a polyline tone
    const rasterResults = [];
    for (const src of rasters) {
      try {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        await img.decode();
        // natural size: any resampling would blend neighbouring pixels and invent off-law colours
        const w = img.naturalWidth || 256;
        const h = img.naturalHeight || 256;
        const oc = new OffscreenCanvas(w, h);
        const ox = oc.getContext('2d', { willReadFrequently: true });
        ox.drawImage(img, 0, 0, w, h);
        const d = ox.getImageData(0, 0, w, h).data;
        let n = 0;
        let off = 0;
        let worst = null;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 64) continue;
          n += 1;
          const ok = onLaw([d[i], d[i + 1], d[i + 2]]);
          if (ok !== true) {
            off += 1;
            if (!worst || ok > worst.distance) worst = { rgb: `rgb(${d[i]}, ${d[i + 1]}, ${d[i + 2]})`, distance: Math.round(ok) };
          }
        }
        rasterResults.push({ src, pixels: n, off, worst });
      } catch (e) {
        rasterResults.push({ src, error: String(e) });
      }
    }
    return { violations, rasterResults, checks };
  }, { TOL: tol, SCOPE: scope || null });
}

async function auditFocus(page, tol) {
  // Tab through the first focusable elements and check the visible focus ring (outline / box-shadow)
  const found = [];
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab');
    const res = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el.closest('[data-user-image], [data-color-audit-ignore], iframe')) return null;
      let o = 1;
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
      if (o < 0.01) return null; // invisible (e.g. Google's transparent button under our pill)
      const cs = getComputedStyle(el);
      return { tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 60), outline: cs.outlineStyle !== 'none' ? cs.outlineColor : null, shadow: cs.boxShadow };
    });
    if (res) found.push(res);
  }
  const bad = [];
  const WINE = [92, 0, 14];
  const onLaw = (c) => {
    let best = Infinity;
    for (const [p0, p1] of [[[255, 255, 255], WINE], [WINE, [0, 0, 0]]]) {
      for (let i = 0; i <= 512; i += 1) {
        const t = i / 512;
        best = Math.min(best, Math.max(...[0, 1, 2].map((k) => Math.abs(c[k] - (p0[k] + (p1[k] - p0[k]) * t)))));
      }
    }
    return best <= tol;
  };
  for (const f of found) {
    for (const raw of [f.outline, ...((f.shadow || '').match(/rgba?\([^)]*\)/g) || [])].filter(Boolean)) {
      const m = raw.match(/[\d.]+/g).map(Number);
      // solid part of the ring; alpha rings are covered by the element walk on the token values
      if ((m[3] ?? 1) >= 0.99 && !onLaw(m.slice(0, 3))) bad.push({ selector: `${f.tag}.${f.cls}`, prop: 'focus ring', value: raw, rendered: raw, distance: -1 });
    }
  }
  return bad;
}

/* ---------------------------------------------------------------- run */
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const report = [];
let total = 0;
try {
  for (const { role, path } of routes) {
    const session = role === 'public' ? null : await apiLogin(api, role);
    for (const theme of themes) {
      for (const width of widths) {
        const context = await newContext(browser, { theme, viewport: { width, height: width < 600 ? 844 : 900 }, session, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.goto(base + path, { waitUntil: 'domcontentloaded' });
        await settle(page);
        const { violations, rasterResults, checks } = await auditPage(page, TOL, args.scope);
        const focus = await auditFocus(page, TOL);
        const rasterViolations = rasterResults
          .filter((r) => r.error || (r.pixels > 0 && r.off / r.pixels > RASTER_MAX_OFF))
          .map((r) => ({
            selector: r.src.replace(base, ''),
            prop: 'raster pixels',
            value: r.error || `${r.off}/${r.pixels} pixels off-law`,
            rendered: r.worst?.rgb || '-',
            distance: r.worst?.distance ?? -1,
          }));
        const all = [...violations, ...focus, ...rasterViolations];
        // de-duplicate identical selector/prop/value triples
        const seen = new Set();
        const unique = all.filter((v) => {
          const k = `${v.selector}|${v.prop}|${v.value}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        total += unique.length;
        report.push({ route: path, role, theme, width, checks, rasters: rasterResults.length, violations: unique });
        console.log(`${unique.length ? 'FAIL' : 'ok  '} ${role}:${path} ${theme} ${width}px — ${checks} colour checks, ${rasterResults.length} rasters, ${unique.length} violations`);
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

writeFileSync(join(out, 'color-audit.json'), JSON.stringify({ tolerance: TOL, total, report }, null, 2));
const lines = [`Colour audit — tolerance ±${TOL}/channel — ${total} violation(s)`, ''];
for (const r of report) {
  lines.push(`## ${r.role}:${r.route} · ${r.theme} · ${r.width}px — ${r.violations.length} violation(s)`);
  for (const v of r.violations.slice(0, 200)) lines.push(`  - ${v.prop}: ${v.value} -> ${v.rendered} (off by ${v.distance})  @ ${v.selector}`);
  if (r.violations.length > 200) lines.push(`  … ${r.violations.length - 200} more in color-audit.json`);
  lines.push('');
}
writeFileSync(join(out, 'color-audit.txt'), lines.join('\n'));
console.log(`\n${total} violation(s). Report: ${join(out, 'color-audit.txt')}`);
process.exit(total ? 1 : 0);
