import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

// The smallclaims S as hard pixels for the hero's marks row: COLS × ROWS, each pixel on where the
// logo covers most of it. Run once; the output is committed.
const ROWS = 22;
const SS = 8;
/** coverage above which a pixel is on */
const ON = 0.42;
/** the S's bounds inside its 80 × 80 viewBox */
const BOX = { x: 10, y: 5, w: 60.4, h: 69.7 };

const src = process.argv[2];
if (!src) {
  console.error('usage: npx tsx scripts/extract-smallclaims.ts <path to smallclaims logo-no-text.svg>');
  process.exit(1);
}
const COLS = Math.round((ROWS * BOX.w) / BOX.h);
const paths = [...readFileSync(src, 'utf8').matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * SS}" height="${ROWS * SS}" viewBox="${BOX.x} ${BOX.y} ${BOX.w} ${BOX.h}" preserveAspectRatio="none">${paths.map((d) => `<path d="${d}" fill="#000"/>`).join('')}</svg>`;
const png = PNG.sync.read(new Resvg(svg).render().asPng());

const px: [number, number][] = [];
for (let j = 0; j < ROWS; j++) {
  for (let i = 0; i < COLS; i++) {
    let a = 0;
    for (let v = 0; v < SS; v++) for (let u = 0; u < SS; u++) a += png.data[((j * SS + v) * png.width + (i * SS + u)) * 4 + 3];
    if (a / (SS * SS * 255) > ON) px.push([i, j]);
  }
}
writeFileSync('src/data/smallclaims-pixels.json', JSON.stringify({ cols: COLS, rows: ROWS, px }));
console.log(`smallclaims: ${px.length} pixels, ${COLS} × ${ROWS}`);
