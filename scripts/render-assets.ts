import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { cellsToSvg } from '../src/lib/dotgrid/svg';
import { navLogoCells, SMALL_CELLS } from '../src/lib/logo/nav';
import { LOCK_CENTRE, pose } from '../src/lib/render/pose';
import { renderLogo } from '../src/lib/render/raymarch';
import { HERO_GEOM } from '../src/lib/render/sdf';
import { SITE } from '../src/lib/seo';

const FONT = 'scripts/assets/DepartureMono-Regular.otf';
const png = (svg: string, width: number) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: 'Departure Mono' } })
    .render()
    .asPng();

/** Lossless re-encode as 8-bit greyscale when every pixel is an opaque grey (the still logo is). */
const greyscale = (buf: Buffer): Buffer => {
  const img = PNG.sync.read(buf);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) if (d[i] !== d[i + 1] || d[i] !== d[i + 2] || d[i + 3] !== 255) return buf;
  return PNG.sync.write(img, { colorType: 0, inputColorType: 6, deflateLevel: 9 });
};

// favicon: the nav logo at the lock pose, square pixels, on a dark rounded square so it reads on light tabs
const favCells = navLogoCells(LOCK_CENTRE, SMALL_CELLS);
const favicon = cellsToSvg({ cols: SMALL_CELLS, rows: SMALL_CELLS, cell: 1, square: true, background: null }, favCells)
  .replace(/(<svg[^>]*>)/, `$1<rect width="${SMALL_CELLS}" height="${SMALL_CELLS}" rx="${Math.round(SMALL_CELLS * 0.2)}" fill="#0A0A0A"/>`);
writeFileSync('public/favicon.svg', favicon);
writeFileSync('public/favicon-32.png', png(favicon, 32));
const touch = cellsToSvg({ cols: SMALL_CELLS, rows: SMALL_CELLS, cell: 1, square: true, background: '#0A0A0A' }, favCells);
writeFileSync('public/apple-touch-icon.png', png(touch, 180));

// still hero logo (no-JS + slow-device fallback): the hero render at the lock pose
const cols = 124, rows = 95;
const heroCells = renderLogo({ cols, rows }, HERO_GEOM, pose(LOCK_CENTRE, 'orbit'));
const still = cellsToSvg({ cols, rows, cell: 560 / cols, bgGrid: true }, heroCells);
writeFileSync('public/logo-still.png', greyscale(png(still, 1120)));

// OG image: logo + motto on the page background
const logoSvg = cellsToSvg({ cols, rows, cell: 4, bgGrid: true }, heroCells)
  .replace('<svg ', '<svg x="352" y="60" ');
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#0A0A0A"/>
${logoSvg}
<text x="600" y="560" text-anchor="middle" font-family="Departure Mono" font-size="28" fill="#EDEDED">${SITE.motto.replace("'", '&#39;')}</text>
</svg>`;
writeFileSync('public/og.png', png(og, 1200));

console.log('wrote favicon.svg, favicon-32.png, apple-touch-icon.png, logo-still.png, og.png');
