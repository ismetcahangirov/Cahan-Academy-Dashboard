#!/usr/bin/env node
// Colour-law static check (fast, runs in CI). See docs/DESIGN.md#colour-law.
//
// Scans client/src for colour literals and Tailwind palette classes:
//   * hex / rgb() / rgba() literals must be tones on the polyline #FFFFFF -> #5C000E -> #000000 (±4);
//   * alpha colours must be #5C000E-based — rgba(0,0,0,a) / rgba(255,255,255,a) make neutral greys
//     over the opposite backdrop, so they are only allowed in the token files (TOKEN_FILES);
//   * hsl()/hsla()/oklch()/named greys are not allowed (write tokens instead);
//   * Tailwind palette classes (red-500, slate-…, emerald-…, gray-…) are not allowed;
//   * white/black with an opacity modifier (bg-black/50, text-white/60) and opacity modifiers on
//     tokens (text-[var(--muted-foreground)]/60, text-ink-muted/70) are not allowed — they composite
//     off the tone line. Wine with an opacity modifier (bg-bordo/10, bg-wine/20) IS allowed.
// Files listed in scripts/color-lint-pending.txt are skipped (pages not migrated yet — page agents
// remove their files from that list when they migrate them).
// A line containing `color-lint-ignore` is skipped (needs a reason in the same comment + review).
//
// Usage: node scripts/color-lint.mjs [--all]   (--all also reports pending files, without failing on them)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const PENDING_FILE = join(ROOT, 'scripts', 'color-lint-pending.txt');
const TOKEN_FILES = new Set(['src/index.css', 'src/styles/components.css']);
const TOL = 4;
const showAll = process.argv.includes('--all');

const rel = (p) => relative(ROOT, p).split(sep).join('/');

const pending = new Set(
  existsSync(PENDING_FILE)
    ? readFileSync(PENDING_FILE, 'utf8')
        .split(/\r?\n/)
        .map((l) => l.replace(/#.*/, '').trim())
        .filter(Boolean)
    : []
);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(jsx?|css)$/.test(name) ? [p] : [];
  });

const WINE = [92, 0, 14];
function polyDist(c) {
  let best = Infinity;
  for (const [p0, p1] of [[[255, 255, 255], WINE], [WINE, [0, 0, 0]]]) {
    for (let i = 0; i <= 512; i += 1) {
      const t = i / 512;
      best = Math.min(best, Math.max(...[0, 1, 2].map((k) => Math.abs(c[k] - (p0[k] + (p1[k] - p0[k]) * t)))));
    }
  }
  return best;
}
const isWine = (c) => Math.max(...[0, 1, 2].map((k) => Math.abs(c[k] - WINE[k]))) <= TOL;
const isBW = (c) => c.every((v) => v <= TOL) || c.every((v) => v >= 255 - TOL);

function hexToRgba(h) {
  let s = h.slice(1);
  if (s.length === 3 || s.length === 4) s = s.split('').map((x) => x + x).join('');
  if (s.length !== 6 && s.length !== 8) return null;
  const n = s.match(/../g).map((x) => parseInt(x, 16));
  return { rgb: n.slice(0, 3), a: n.length === 4 ? n[3] / 255 : 1 };
}

const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const UTIL = 'bg|text|border(?:-[trblxy])?|ring(?:-offset)?|fill|stroke|from|via|to|outline|shadow|divide|placeholder|accent|caret|decoration';
const RX = {
  hex: /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g,
  rgb: /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/g,
  otherFn: /\b(?:hsla?|oklch|oklab|lab|lch|hwb)\(/g,
  palette: new RegExp(`\\b(?:${UTIL})-(?:${PALETTE})-\\d{2,3}(?:/\\d+)?\\b`, 'g'),
  bwAlpha: new RegExp(`\\b(?:${UTIL})-(?:white|black)/(?:\\d+|\\[[^\\]]+\\])`, 'g'),
  tokenAlpha: new RegExp(`\\b(?:${UTIL})-(?:\\[(?:var\\()?--[\\w-]+\\)?\\]|(?!bordo|wine|white|black|transparent|current|inherit)[a-z][\\w-]*)/(?:\\d+|\\[[^\\]]+\\])`, 'g'),
  named: /:\s*(?:gray|grey|silver|darkgray|lightgray|gainsboro|whitesmoke|dimgray|red|green|blue|orange|yellow)\s*[;!]/g,
};

const problems = [];
let scanned = 0;
const files = walk(SRC);

for (const file of files) {
  const r = rel(file);
  const isPending = pending.has(r);
  if (isPending && !showAll) continue;
  if (r.endsWith('brandPaths.js')) continue; // geometry only
  scanned += 1;
  const isToken = TOKEN_FILES.has(r);
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes('color-lint-ignore')) return;
    // drop data: URIs with encoded hex (%23...) — they are checked by the runtime audit
    const L = line;
    const add = (msg, hit) => problems.push({ file: r, line: i + 1, msg, hit: hit.trim().slice(0, 80), pending: isPending });

    for (const m of L.matchAll(RX.hex)) {
      const c = hexToRgba(m[0]);
      if (!c) continue;
      if (c.a < 1) {
        if (!isWine(c.rgb) && !(isToken && isBW(c.rgb))) add('alpha colour must be #5C000E-based', m[0]);
      } else if (polyDist(c.rgb) > TOL) add(`hex off the white→#5C000E→black line (by ${Math.round(polyDist(c.rgb))})`, m[0]);
    }
    for (const m of L.matchAll(RX.rgb)) {
      const rgb = [m[1], m[2], m[3]].map(Number);
      let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : Number(m[4]);
      if (Number.isNaN(a)) a = 1;
      if (a < 1) {
        if (!isWine(rgb) && !(isToken && isBW(rgb))) add('alpha colour must be rgba(92, 0, 14, a) (black/white alpha only in token files)', m[0]);
      } else if (polyDist(rgb) > TOL) add(`rgb off the white→#5C000E→black line (by ${Math.round(polyDist(rgb))})`, m[0]);
    }
    for (const m of L.matchAll(RX.otherFn)) add('use tokens instead of hsl()/oklch()/lab() colours', m[0]);
    for (const m of L.matchAll(RX.palette)) add('Tailwind palette colour — use tokens (text-ink-muted, bg-surface-2, border-line …)', m[0]);
    for (const m of L.matchAll(RX.bwAlpha)) add('white/black with opacity makes greys — use a token or wine alpha (bg-wine/10)', m[0]);
    if (!isToken) {
      for (const m of L.matchAll(RX.tokenAlpha)) {
        if (/^(?:shadow|ring-offset)/.test(m[0])) continue;
        add('opacity modifier on a token composites off the tone line — use a token (ink-muted, ink-subtle, line …)', m[0]);
      }
    }
    if (file.endsWith('.css')) for (const m of L.matchAll(RX.named)) add('named colour — use tokens', m[0]);
  });
}

const stale = [...pending].filter((p) => !existsSync(join(ROOT, p)));
const active = problems.filter((p) => !p.pending);
const byFile = new Map();
for (const p of problems) byFile.set(p.file, [...(byFile.get(p.file) || []), p]);
for (const [file, list] of byFile) {
  console.log(`\n${file}${list[0].pending ? '  (pending migration)' : ''}`);
  for (const p of list.slice(0, 40)) console.log(`  ${p.line}: ${p.msg}  ←  ${p.hit}`);
  if (list.length > 40) console.log(`  … ${list.length - 40} more`);
}
if (stale.length) console.log(`\nwarning: ${stale.length} stale entr${stale.length > 1 ? 'ies' : 'y'} in color-lint-pending.txt: ${stale.join(', ')}`);
console.log(
  `\ncolor-lint: ${scanned} files scanned, ${pending.size} pending migration, ${active.length} violation(s)${showAll ? `, ${problems.length - active.length} in pending files` : ''}`
);
process.exit(active.length ? 1 : 0);
