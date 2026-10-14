/** Renders every Figbot teaser output into figbot/out/. Run: npx tsx figbot/render.ts */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';
import { EXPRESSIONS, GRID, POSES, cells, type Pose } from './src/model';
import { BG_COLOR, FG_COLOR, svgBody, toSvg } from './src/svg';
import { FPS, LOOP, poseAt } from './src/timeline';

const OUT = 'figbot/out';
const FONT = 'scripts/assets/DepartureMono-Regular.otf';

const png = (svg: string, width: number) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: 'Departure Mono' } })
    .render()
    .asPng();
const square = (p: Pose) => toSvg(cells(p, GRID, GRID), GRID, GRID);

mkdirSync(`${OUT}/expressions`, { recursive: true });

// hero: Idle, square and 16:9 (sphere bottom-left, black space to the right)
const hero = square(POSES.idle);
writeFileSync(`${OUT}/hero-square.svg`, hero);
writeFileSync(`${OUT}/hero-square.png`, png(hero, 2048));
const WIDE = (GRID * 16) / 9; // 85.33 cells: crop the last column so the PNG is exactly 2560×1440
writeFileSync(`${OUT}/hero-wide.png`, png(toSvg(cells(POSES.idle, Math.ceil(WIDE), GRID, { x0: 4, y0: 0, size: GRID }), Math.ceil(WIDE), GRID, WIDE), 2560));

// expressions: one PNG each, plus a labelled 4 + 3 sheet
const TILE = 560, GAP = 40, MARGIN = 80, LABEL = 70, PER_ROW = 4;
const tiles = EXPRESSIONS.map((name, n) => {
  const c = cells(POSES[name], GRID, GRID);
  writeFileSync(`${OUT}/expressions/${name}.png`, png(toSvg(c, GRID, GRID), 1024));
  const x = MARGIN + (n % PER_ROW) * (TILE + GAP);
  const y = MARGIN + Math.floor(n / PER_ROW) * (TILE + LABEL + GAP);
  const label = name[0].toUpperCase() + name.slice(1);
  return `<svg x="${x}" y="${y}" width="${TILE}" height="${TILE}" viewBox="0 0 ${GRID} ${GRID}">${svgBody(c, GRID, GRID)}</svg>`
    + `<text x="${x}" y="${y + TILE + 44}" font-family="Departure Mono" font-size="28" fill="${FG_COLOR}" fill-opacity="0.4">${label}</text>`;
});
const rows = Math.ceil(EXPRESSIONS.length / PER_ROW);
const W = MARGIN * 2 + PER_ROW * TILE + (PER_ROW - 1) * GAP;
const H = MARGIN * 2 + rows * (TILE + LABEL) + (rows - 1) * GAP;
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${BG_COLOR}"/>${tiles.join('')}</svg>`;
writeFileSync(`${OUT}/sheet.png`, png(sheet, W));

// loop: 420 deterministic frames → MP4 (1080², 30 fps) and GIF (540², 15 fps)
const frames = mkdtempSync(join(tmpdir(), 'figbot-'));
try {
  for (let f = 0; f < LOOP * FPS; f++) {
    writeFileSync(join(frames, `f${String(f).padStart(4, '0')}.png`), png(square(poseAt(f / FPS)), 1080));
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', `${OUT}/loop.mp4`]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${OUT}/loop.mp4`,
    '-vf', 'fps=15,scale=540:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=16[p];[b][p]paletteuse=dither=none', '-loop', '0', `${OUT}/loop.gif`]);
} finally {
  rmSync(frames, { recursive: true, force: true });
}

console.log('figbot/out written');
