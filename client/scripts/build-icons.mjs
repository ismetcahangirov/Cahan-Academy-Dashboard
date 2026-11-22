// Rasterise the brand mark into favicon / app icon PNGs with headless Chromium.
// Run after scripts/build-brand.py:  node scripts/build-icons.mjs
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const markSvg = readFileSync(join(pub, 'brand', 'mark.svg'), 'utf8');
const whiteSvg = readFileSync(join(pub, 'brand', 'mark-white.svg'), 'utf8');

// [file, size, background, svg, inner scale]
const targets = [
  ['favicon-16.png', 16, 'transparent', markSvg, 1],
  ['favicon-32.png', 32, 'transparent', markSvg, 1],
  ['apple-touch-icon.png', 180, '#5C000E', whiteSvg, 0.72],
  ['icon-192.png', 192, '#5C000E', whiteSvg, 0.72],
  ['icon-512.png', 512, '#5C000E', whiteSvg, 0.72],
  ['icon-maskable-512.png', 512, '#5C000E', whiteSvg, 0.6],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, bg, svg, scale] of targets) {
  const inner = Math.round(size * scale);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:${bg};width:${size}px;height:${size}px;display:grid;place-items:center">` +
      `<div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`
  );
  const buf = await page.screenshot({ omitBackground: bg === 'transparent', type: 'png' });
  writeFileSync(join(pub, file), buf);
  console.log('wrote', file);
}
await browser.close();

writeFileSync(
  join(pub, 'site.webmanifest'),
  JSON.stringify(
    {
      name: 'Cahan Academy',
      short_name: 'Cahan',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      theme_color: '#5C000E',
      background_color: '#FFFFFF',
      display: 'standalone',
    },
    null,
    2
  ) + '\n'
);
console.log('wrote site.webmanifest');
