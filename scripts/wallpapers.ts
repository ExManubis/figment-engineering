// Renders the downloadable wallpapers into public/wallpapers (full size, plus previews for the section) and records
// their file sizes in src/data/wallpaper-sizes.json. Run manually when a design changes; the output is committed.
//   npx tsx scripts/wallpapers.ts [design,…]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DEVICES, THUMB_WIDTH, WALLPAPERS, downloadPath, previewPath, thumbPath, type DeviceId } from '../src/data/wallpapers';
import { DESIGNS } from './wallpapers/designs';
import { Wall } from './wallpapers/wall';

const SIZES = 'src/data/wallpaper-sizes.json';
const only = process.argv[2]?.split(',');
const sizes: Record<string, Partial<Record<DeviceId, number>>> = JSON.parse(readFileSync(SIZES, 'utf8'));

for (const { id } of WALLPAPERS) {
  if (only && !only.includes(id)) continue;
  for (const d of DEVICES) {
    const w = new Wall(d.width, d.height, d.cell);
    DESIGNS[id](w);
    const full = w.png();
    const preview = w.png(d.previewWidth);
    const files: [string, Buffer][] = [[downloadPath(id, d.id), full], [previewPath(id, d.id), preview]];
    if (d.id === 'mac') files.push([thumbPath(id), w.png(THUMB_WIDTH)]);
    for (const [path, buf] of files) {
      mkdirSync(`public${path.slice(0, path.lastIndexOf('/'))}`, { recursive: true });
      writeFileSync(`public${path}`, buf);
    }
    (sizes[id] ??= {})[d.id] = full.length;
    console.log(`${id} ${d.id}: ${(full.length / 1e6).toFixed(2)} MB, preview ${Math.round(preview.length / 1e3)} KB`);
  }
}
writeFileSync(SIZES, `${JSON.stringify(sizes, null, 2)}\n`);
