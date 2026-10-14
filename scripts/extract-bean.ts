import { readFileSync, writeFileSync } from 'node:fs';
import { parseBeanSvg } from '../src/lib/sparks/parse';

const src = process.argv[2];
if (!src) {
  console.error('usage: npx tsx scripts/extract-bean.ts <path to claudewitz/assets/logo-dark.svg>');
  process.exit(1);
}
const bean = parseBeanSvg(readFileSync(src, 'utf8'));
writeFileSync('src/data/claudewitz-bean.json', JSON.stringify(bean));
console.log(`bean: ${bean.dots.length} dots, ${bean.cols} × ${bean.rows}`);
