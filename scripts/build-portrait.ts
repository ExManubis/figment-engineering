import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { placeholderLuminance, toDotCells } from '../src/lib/portrait/dither';

const COLS = 64;
const arg = process.argv[2];
if (!arg) {
  console.error('usage: npx tsx scripts/build-portrait.ts <photo.png> | --placeholder');
  process.exit(1);
}

let data;
if (arg === '--placeholder') {
  data = toDotCells(placeholderLuminance(256, 320), 256, 320, COLS);
} else {
  const png = PNG.sync.read(readFileSync(arg));
  const lum = new Float32Array(png.width * png.height);
  for (let i = 0; i < lum.length; i++) {
    const r = png.data[i * 4], g = png.data[i * 4 + 1], b = png.data[i * 4 + 2], a = png.data[i * 4 + 3];
    lum[i] = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * (a / 255);
  }
  data = toDotCells(lum, png.width, png.height, COLS);
}
writeFileSync('src/data/portrait.json', JSON.stringify(data));
console.log(`portrait: ${data.cols} × ${data.rows}, ${data.cells.filter((v) => v > 0).length} dots`);
