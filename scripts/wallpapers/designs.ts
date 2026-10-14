// The wallpaper designs, each drawn for any screen size.
import bean from '../../src/data/claudewitz-bean.json';
import { mulberry32 } from '../../src/lib/decode/rng';
import type { DotCell } from '../../src/lib/dotgrid/paint';
import { CYCLE, LOCK_CENTRE, pose } from '../../src/lib/render/pose';
import { renderLogo } from '../../src/lib/render/raymarch';
import { HERO_GEOM } from '../../src/lib/render/sdf';
import { ansiShadow } from '../../src/lib/type/figlet';
import { ADVANCE, artWidth, Wall } from './wall';

const TUMBLE = 2.6;
const CUBE_ONLY = { ...HERO_GEOM, noArms: true, span: 1.0 };
const CW_GRADIENT = ['#DA702C', '#3AA99F'];

/** label-style text: small caps-like spacing, grey */
const label = (w: Wall, x: number, y: number, s: string, size: number, anchor = 'start', opacity = 0.5) =>
  w.text(x, y, s, size, { opacity, anchor, spacing: size * 0.14 });

/** the corner marks every design shares: name bottom-left, coordinates bottom-right */
function marks(w: Wall, name = ['FIGMENT', 'ENGINEERING']) {
  const portrait = w.H > w.W;
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.022 : 0.012)), pad = w.cell * 4, base = w.H - w.cell * (portrait ? 8 : 4);
  label(w, pad, base - fs * 1.25, name[0], fs);
  label(w, pad, base, name[1], fs);
  label(w, w.W - pad, base - fs * 1.25, '55.68°N 12.57°E', fs, 'end');
  label(w, w.W - pad, base, 'CPH', fs, 'end');
}

const grid = (w: Wall) => ({ cols: Math.floor(w.W / w.cell), rows: Math.floor(w.H / w.cell) });

/** 1 · Monolith: the hero cube and brackets, huge, on the texture's own grid */
function monolith(w: Wall, t = TUMBLE) {
  const g = grid(w), portrait = w.H > w.W;
  const cols = Math.round(portrait ? g.cols * 0.92 : g.rows * 0.58 * 124 / 95), rows = Math.round(cols * 95 / 124);
  const gi = Math.round((g.cols - cols) / 2), gj = Math.round(portrait ? g.rows * 0.5 : (g.rows - rows) / 2 - g.rows * 0.03);
  const cells = renderLogo({ cols, rows, ss: 3 }, HERO_GEOM, pose(t, 'orbit'));
  w.texture(0.09, { cx: 0.5, cy: portrait ? 0.62 : 0.5, rx: 0.75, ry: 0.7, inner: 0.35 }, (i, j) => Boolean(cells[(j - gj) * cols + (i - gi)]) && i >= gi && i < gi + cols);
  w.cells(cells, cols, rows, gi, gj);
  marks(w);
}

/** 2 · Motion study: one cycle of the cube, frame by frame, like a contact sheet */
function study(w: Wall) {
  const g = grid(w), portrait = w.H > w.W;
  const n = portrait ? 4 : 7, perRow = portrait ? 2 : 7;
  const size = Math.floor((portrait ? g.cols * 0.86 : g.cols * 0.9) / perRow);
  const gapCells = portrait ? Math.round(size * 0.35) : 0;
  const rowsOf = Math.ceil(n / perRow);
  const blockH = rowsOf * size + (rowsOf - 1) * gapCells;
  const gi0 = Math.round((g.cols - size * perRow) / 2), gj0 = Math.round((g.rows - blockH) / 2);
  w.texture(0.09);
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.02 : 0.0115));
  for (let k = 0; k < n; k++) {
    const t = LOCK_CENTRE - CYCLE * 0.75 + (k / (n - 1)) * (CYCLE * 0.75);
    const cells = renderLogo({ cols: size, rows: size, ss: 2 }, CUBE_ONLY, pose(t, 'orbit'));
    const gi = gi0 + (k % perRow) * size, gj = gj0 + Math.floor(k / perRow) * (size + gapCells);
    w.cells(cells, size, size, gi, gj);
    const cx = (gi + size / 2) * w.cell, y = (gj + size) * w.cell + fs * 1.6;
    label(w, cx, y, k === n - 1 ? 'LOCK' : `T+${(t - (LOCK_CENTRE - CYCLE * 0.75)).toFixed(2)}S`, fs, 'middle', k === n - 1 ? 0.8 : 0.45);
  }
  const pad = w.cell * 4, top = w.cell * (portrait ? 14 : 5) + fs;
  label(w, pad, top, 'FIGMENT ENGINEERING', fs, 'start', 0.7);
  label(w, pad, top + fs * 1.4, 'MOTION STUDY 01 · ONE TURN TO LOCK', fs, 'start', 0.45);
  label(w, w.W - pad, top, `${CYCLE.toFixed(1)}S / CYCLE`, fs, 'end', 0.45);
  marks(w);
}

/** box-drawing frame as text, on the grid, with a label set into the top edge */
function frame(w: Wall, x0: number, y0: number, cols: number, rows: number, fs: number, text: string, fill: string) {
  const top = '┌─ ' + text + ' ' + '─'.repeat(Math.max(0, cols - text.length - 5)) + '┐';
  const lh = fs * 1.0;
  w.text(x0, y0, top, fs, { fill });
  for (let r = 1; r < rows - 1; r++) {
    w.text(x0, y0 + r * lh, '│', fs, { fill });
    w.text(x0 + (cols - 1) * fs * ADVANCE, y0 + r * lh, '│', fs, { fill });
  }
  w.text(x0, y0 + (rows - 1) * lh, '└' + '─'.repeat(cols - 2) + '┘', fs, { fill });
}

/** 3 · Homepage: the hero as a poster: decode frame, cube, the name, the marks */
function homepage(w: Wall) {
  const g = grid(w), portrait = w.H > w.W;
  w.texture(0.09);
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.022 : 0.0135));
  const fcols = Math.floor((w.W * 0.9) / (fs * ADVANCE)), frows = Math.floor((w.H * (portrait ? 0.72 : 0.78)) / fs);
  const fx = (w.W - fcols * fs * ADVANCE) / 2, fy = (w.H - frows * fs) / 2 + fs * 0.8 - (portrait ? w.H * 0.02 : w.H * 0.02);
  frame(w, fx, fy, fcols, frows, fs, '00 / FIGMENT ENGINEERING', '#3A3A3A');
  const rows = Math.round(g.rows * (portrait ? 0.24 : 0.36)), cols = Math.round(rows * 124 / 95);
  const gi = Math.round((g.cols - cols) / 2), gj = Math.round(g.rows * (portrait ? 0.26 : 0.17));
  w.cells(renderLogo({ cols, rows, ss: 3 }, HERO_GEOM, pose(TUMBLE, 'orbit')), cols, rows, gi, gj);
  const title = Math.round(Math.min(w.W, w.H) * (portrait ? 0.11 : 0.08));
  const ty = (gj + rows) * w.cell + title * 1.3;
  // the hero title's face
  w.text(w.W / 2, ty, 'Figment', title, { anchor: 'middle', family: 'Bitcount Prop Single' });
  w.text(w.W / 2, ty + title * 1.2, 'Engineering', title, { anchor: 'middle', family: 'Bitcount Prop Single' });
  marks(w);
}

/** 4 · Macro: the cube up close and off-centre, cropped by the screen's edge, in big coarse dots */
function macro(w: Wall) {
  const portrait = w.H > w.W;
  const cellBig = w.cell * 2;
  const big = new Wall(w.W, w.H, cellBig);
  big.parts = w.parts;
  const cols = Math.ceil(w.W / cellBig), rows = Math.ceil(w.H / cellBig);
  // render a square region bigger than the screen's short side and shift it so the cube hangs off one edge
  const n = Math.round((portrait ? cols : rows) * 1.5);
  const cells = renderLogo({ cols: n, rows: n, ss: 2 }, { ...HERO_GEOM, noArms: true, span: 0.62 }, pose(TUMBLE + 0.35, 'orbit'));
  // hang it off the top-right corner, leaving the bottom corners (and their marks) on black
  const gi = portrait ? Math.round(cols - n * 0.55) : Math.round(cols - n * 0.62), gj = portrait ? Math.round((rows - n) / 2) : Math.round(-n * 0.44);
  big.texture(0.08, { cx: portrait ? 0.35 : 0.3, cy: portrait ? 0.7 : 0.62, rx: 0.9, ry: 0.9, inner: 0.2 }, (i, j) => i - gi >= 0 && i - gi < n && Boolean(cells[(j - gj) * n + (i - gi)]));
  big.cells(cells, n, n, gi, gj);
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.022 : 0.012));
  const pad = w.cell * 4, top = w.cell * (portrait ? 14 : 5) + fs;
  label(w, pad, top, 'FIGMENT ENGINEERING', fs, 'start', 0.7);
  label(w, pad, top + fs * 1.4, 'CUBE · 0.40 · BEVEL 0.03', fs, 'start', 0.45);
  marks(w);
}

const beanCells = (): DotCell[] => {
  const out: DotCell[] = new Array(bean.cols * bean.rows);
  for (const d of bean.dots) out[d.y * bean.cols + d.x] = { cov: 1, lum: 1, color: d.color };
  return out;
};

/** 5 · Claudewitz: the bean, big, beside (or above) its gradient ANSI header and the install line, as one centred group */
function claudewitz(w: Wall) {
  const portrait = w.H > w.W;
  const half = w.cell / 2; // bean dot pitch in half-cells, so it lines up with the texture every other dot or better
  const target = portrait ? (w.W * 0.62) / bean.cols : (w.H * 0.52) / bean.rows;
  const bc = Math.max(half, Math.round(target / half) * half);
  const beanW = bean.cols * bc, beanH = bean.rows * bc;
  const art = ansiShadow('Claudewitz');
  const fs = Math.floor((portrait ? w.W * 0.84 : w.W * 0.34) / artWidth(art, 1));
  const aw = artWidth(art, fs), ah = 6 * fs;
  const small = Math.round(Math.min(w.W, w.H) * (portrait ? 0.024 : 0.014));
  const textH = ah + small * 4.2;
  let bx: number, by: number, ax: number, ay: number;
  if (portrait) {
    const gap = w.H * 0.035, total = beanH + gap + textH;
    by = w.H * 0.58 - total / 2; bx = (w.W - beanW) / 2;
    ax = (w.W - aw) / 2; ay = by + beanH + gap;
  } else {
    const gap = w.W * 0.05, total = beanW + gap + aw;
    bx = (w.W - total) / 2; by = (w.H - beanH) / 2;
    ax = bx + beanW + gap; ay = w.H / 2 - textH / 2;
  }
  w.texture(0.09, { cx: 0.5, cy: 0.5, rx: 0.75, ry: 0.7, inner: 0.35 });
  const pw = new Wall(w.W, w.H, bc);
  pw.parts = w.parts;
  pw.cells(beanCells(), bean.cols, bean.rows, bx / bc, by / bc, { scale: 1.05 });
  w.art(ax, ay, art, fs, w.gradient('cw', ax, ax + aw, CW_GRADIENT));
  w.text(ax, ay + ah + small * 2.2, '$ brew install exmanubis/tap/claudewitz', small, { opacity: 0.55 });
  w.text(ax, ay + ah + small * 3.8, 'A Crush-style terminal UI for Claude Code.', small, { opacity: 0.35 });
  marks(w, ['CLAUDEWITZ', 'FIGMENT ENGINEERING']);
}

/** 6 · Dissolve: the bean coming apart into sparks that drift off across the screen */
function dissolve(w: Wall) {
  const portrait = w.H > w.W;
  const rng = mulberry32(7);
  const g = grid(w);
  const pitch = Math.max(1, Math.round((g.rows * (portrait ? 0.3 : 0.5)) / bean.rows));
  const bc = w.cell * pitch;
  const pw = new Wall(w.W, w.H, bc);
  pw.parts = w.parts;
  const pg = grid(pw);
  const gi = portrait ? Math.round((pg.cols - bean.cols) / 2) : Math.round(pg.cols * 0.3 - bean.cols / 2);
  const gj = portrait ? Math.round(pg.rows * 0.3) : Math.round((pg.rows - bean.rows) / 2);
  w.texture(0.08, { cx: 0.5, cy: 0.5, rx: 0.75, ry: 0.7, inner: 0.35 });
  // the further right (or down) a dot sits in the bean, the further it has blown away, snapped back onto the grid
  const reach = portrait ? w.H * 0.4 : w.W * 0.55;
  for (const d of bean.dots) {
    const u = portrait ? d.y / bean.rows : d.x / bean.cols;
    const edge = 0.8 + (rng() - 0.5) * 0.08;
    const k = Math.max(0, (u - edge) / (1 - edge)) ** 1.3 * (0.35 + rng() * 0.9);
    const jitter = (rng() - 0.5) * (portrait ? w.W * 0.25 : w.H * 0.22) * k;
    let x = (gi + d.x + 0.5) * bc, y = (gj + d.y + 0.5) * bc;
    if (portrait) { y += k * reach; x += jitter; } else { x += k * reach; y += jitter; }
    // snap onto the fine texture grid so loose sparks sit on dots
    const c = w.cell;
    x = (Math.floor(x / c) + 0.5) * c; y = (Math.floor(y / c) + 0.5) * c;
    const r = (k > 0.02 ? c * (0.42 - Math.min(0.25, k * 0.25)) : bc * 0.42);
    const a = k > 0.02 ? Math.max(0.25, 1 - k * 0.7) : 1;
    w.raw(`<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${d.color}" fill-opacity="${a.toFixed(3)}"/>`);
  }
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.024 : 0.017));
  const pad = w.cell * 4, top = w.cell * (portrait ? 14 : 5) + fs;
  label(w, w.W - pad, top, 'CLAUDEWITZ', fs, 'end', 0.7);
  marks(w, ['CLAUDEWITZ', 'FIGMENT ENGINEERING']);
}

export const DESIGNS: Record<string, (w: Wall) => void> = {
  'fe-monolith': (w) => monolith(w),
  'fe-motion-study': study,
  'fe-homepage': homepage,
  'fe-macro': macro,
  'cw-bean': claudewitz,
  'cw-dissolve': dissolve,
};
