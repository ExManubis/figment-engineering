// The wallpaper designs, each drawn for any screen size.
import { about } from '../../src/data/about';
import bean from '../../src/data/claudewitz-bean.json';
import { GLYPHS, mulberry32 } from '../../src/lib/decode/rng';
import type { DotCell } from '../../src/lib/dotgrid/paint';
import { CYCLE, LOCK_CENTRE, pose, type Pose } from '../../src/lib/render/pose';
import { qAxis, qConj, qMul, qRot, type Quat } from '../../src/lib/render/quat';
import { renderLogo } from '../../src/lib/render/raymarch';
import { HERO_GEOM } from '../../src/lib/render/sdf';
import { ansiShadow } from '../../src/lib/type/figlet';
import { ADVANCE, artWidth, FG, Wall } from './wall';

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
  // the frames are spaced as steps of one turn, but the last step, the lock itself, is left out
  const steps = portrait ? 4 : 7, n = steps - 1, perRow = portrait ? 2 : 7;
  const size = Math.floor((portrait ? g.cols * 0.86 : g.cols * 0.9) / perRow);
  const gapCells = portrait ? Math.round(size * 0.35) : 0;
  const rowsOf = Math.ceil(n / perRow);
  const blockH = rowsOf * size + (rowsOf - 1) * gapCells;
  const gj0 = Math.round((g.rows - blockH) / 2);
  w.texture(0.09);
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.02 : 0.0115));
  for (let k = 0; k < n; k++) {
    const t = LOCK_CENTRE - CYCLE * 0.75 + (k / (steps - 1)) * (CYCLE * 0.75);
    const cells = renderLogo({ cols: size, rows: size, ss: 2 }, CUBE_ONLY, pose(t, 'orbit'));
    // each row centred on its own, so a short last row sits in the middle
    const row = Math.floor(k / perRow), inRow = Math.min(perRow, n - row * perRow);
    const gi = Math.round((g.cols - size * inRow) / 2) + (k % perRow) * size, gj = gj0 + row * (size + gapCells);
    w.cells(cells, size, size, gi, gj);
    const cx = (gi + size / 2) * w.cell, y = (gj + size) * w.cell + fs * 1.6;
    label(w, cx, y, `T+${(t - (LOCK_CENTRE - CYCLE * 0.75)).toFixed(2)}S`, fs, 'middle', 0.45);
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

const LINE = '#3A3A3A';
/** a fixed orthographic view of the bare cube: the camera turned, the cube square to the world */
const view = (qCam: Quat): Pose => ({ qCam, qCube: [1, 0, 0, 0], S: 1, w: 1 });
/** half the cube's projected width and height under a view, from its eight corners */
function extent(qCam: Quat, half = 0.4): [number, number] {
  let x = 0, y = 0;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const p = qRot(qCam, [sx * half, sy * half, sz * half]);
    x = Math.max(x, Math.abs(p[0])); y = Math.max(y, Math.abs(p[1]));
  }
  return [x, y];
}

/** a box-drawing frame fitted to a px rectangle, its label set into the top edge */
function box(w: Wall, x: number, y: number, wPx: number, hPx: number, fs: number, text: string, fill = LINE) {
  frame(w, x, y + fs * 0.8, Math.floor(wPx / (fs * ADVANCE)), Math.floor(hPx / fs), fs, text, fill);
}

/** a dimension line from x1 to x2 at height y: ticks at the ends, the measurement centred beneath */
function dimension(w: Wall, x1: number, x2: number, y: number, text: string, fs: number) {
  const sw = Math.max(1, w.cell * 0.08), tick = fs * 0.45;
  w.raw(`<path d="M${x1} ${y}H${x2}M${x1} ${y - tick}V${y + tick}M${x2} ${y - tick}V${y + tick}" stroke="#5A5A5A" stroke-width="${sw}" fill="none"/>`);
  label(w, (x1 + x2) / 2, y + fs * 1.6, text, fs, 'middle', 0.55);
}

/** a table in box-drawing characters: its lines in the frame grey, its words over them in the label grey */
function table(w: Wall, x: number, y: number, lines: string[], fs: number) {
  lines.forEach((l, k) => {
    w.text(x, y + k * fs, l.replace(/[^┌┐└┘├┤┬┴┼─│]/g, ' '), fs, { fill: LINE });
    w.text(x, y + k * fs, l.replace(/[┌┐└┘├┤┬┴┼─│]/g, ' '), fs, { opacity: k === 1 ? 0.8 : 0.5 });
  });
}

/** 7 · Blueprint: the cube as an engineering drawing: three true views, the assembly, dimensions and a title block */
function blueprint(w: Wall) {
  const portrait = w.H > w.W;
  w.texture(0.07);
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.02 : 0.0115));
  // the sheet
  const sx = w.W * 0.05, sw = w.W * 0.9;
  const sy = portrait ? w.H * 0.34 : w.H * 0.08, sh = portrait ? w.H * 0.56 : w.H * 0.8;
  box(w, sx, sy, sw, sh, fs, 'DRAWING FE-001 / CUBE');
  // the title block, bottom right of the sheet
  const cw = 13, vw = portrait ? 14 : 22;
  const rule = (l: string, m: string, r: string) => l + '─'.repeat(cw) + m + '─'.repeat(vw) + r;
  const row = (k: string, v: string) => '│ ' + k.padEnd(cw - 1) + '│ ' + v.padEnd(vw - 1) + '│';
  const tb = [
    rule('┌', '─', '┐'),
    '│ ' + 'FIGMENT ENGINEERING'.padEnd(cw + vw) + '│',
    rule('├', '┬', '┤'),
    row('PART', 'FE-001 CUBE'), row('MATERIAL', 'DOTS, 0.11 R'), row('SCALE', '1:1 (D 1:2)'), row('SHEET', '1 OF 1'), row('DRAWN', 'CPH 2026'),
    rule('└', '┴', '┘'),
  ];
  const tbW = (cw + vw + 3) * fs * ADVANCE, tbH = tb.length * fs;
  const m = fs * 2.2;
  const tbx = sx + sw - m - tbW, tby = sy + sh - m - tbH;
  table(w, tbx, tby + fs, tb, fs);
  // the four views: a row across a wide sheet, a 2 × 2 above the title block on squarer screens
  const wide = w.W / w.H > 1.5;
  const nc = wide ? 4 : 2, nr = wide ? 1 : 2, gap = fs * 1.5;
  const ax = sx + m, ay = sy + m * 1.2, aw = sw - 2 * m, ah = tby - gap - ay;
  const pw = (aw - gap * (nc - 1)) / nc, ph = Math.min((ah - gap * (nr - 1)) / nr, pw * 1.15);
  // a landscape row of panels sits in the middle of the space above the title block
  const py0 = ay + (ah - nr * ph - (nr - 1) * gap) / 2;
  const iso = qMul(qAxis([1, 0, 0], -Math.asin(1 / Math.sqrt(3))), qAxis([0, 1, 0], Math.PI / 4));
  const views: [string, Quat | null][] = [
    ['A · FRONT', [1, 0, 0, 0]], ['B · 45°', qAxis([0, 1, 0], Math.PI / 4)], ['C · ISOMETRIC', iso], ['D · ASSEMBLY 1:2', null],
  ];
  const SPAN = 0.75;
  views.forEach(([name, q], k) => {
    const px = ax + (k % nc) * (pw + gap), py = py0 + Math.floor(k / nc) * (ph + gap);
    box(w, px, py, pw, ph, fs, name);
    const n = Math.floor((Math.min(pw, ph) * 0.8) / w.cell);
    const cx = px + pw / 2, cy = py + ph * 0.45;
    const gi = Math.round(cx / w.cell - n / 2), gj = Math.round(cy / w.cell - n / 2);
    const scale = (n / 2) * w.cell / SPAN; // px per world unit
    if (!q) {
      // the assembly fills its panel, so the brackets' thin arms still land on a dot
      const na = Math.floor((Math.min(pw, ph) * 0.96) / w.cell);
      const ai = Math.round(cx / w.cell - na / 2), aj = Math.round((py + ph / 2) / w.cell - na / 2);
      w.cells(renderLogo({ cols: na, rows: na, ss: 3 }, { ...HERO_GEOM, span: SPAN * 2 * (na / n) }, pose(LOCK_CENTRE, 'orbit')), na, na, ai, aj);
      return;
    }
    w.cells(renderLogo({ cols: n, rows: n, ss: 3 }, { ...CUBE_ONLY, span: SPAN }, view(q)), n, n, gi, gj);
    const [ex, ey] = extent(q);
    const mx = (gi + n / 2) * w.cell, my = (gj + n / 2) * w.cell;
    dimension(w, mx - ex * scale, mx + ex * scale, my + ey * scale + fs * 1.4, (ex * 2).toFixed(2), fs);
    if (k === 0) {
      // the height too, and the bevel
      const x = mx + ex * scale + fs * 1.4, sw = Math.max(1, w.cell * 0.08), tick = fs * 0.45;
      w.raw(`<path d="M${x} ${my - ey * scale}V${my + ey * scale}M${x - tick} ${my - ey * scale}H${x + tick}M${x - tick} ${my + ey * scale}H${x + tick}" stroke="#5A5A5A" stroke-width="${sw}" fill="none"/>`);
      label(w, x + fs * 0.8, my + fs * 0.35, (ey * 2).toFixed(2), fs, 'start', 0.55);
      label(w, mx - ex * scale, my - ey * scale - fs * 0.8, 'R 0.03', fs, 'start', 0.55);
    }
  });
  marks(w);
}

/** 8 · Field: a grid of cubes seen from one camera, a wave of tumble running corner to corner, one of them at lock */
function field(w: Wall) {
  const g = grid(w), portrait = w.H > w.W;
  const nc = portrait ? 5 : 12, tile = Math.floor((g.cols * 0.88) / nc);
  const top = portrait ? Math.round(g.rows * 0.36) : 0;
  const nr = Math.floor((portrait ? g.rows - top - 16 : g.rows * 0.8) / tile);
  const gi0 = Math.round((g.cols - nc * tile) / 2), gj0 = portrait ? top : Math.round((g.rows - nr * tile) / 2);
  // the lock sits a third of the way in from the top-right corner
  const li = Math.floor(nc * 0.68), lj = Math.floor(nr * 0.34);
  const cam = pose(LOCK_CENTRE, 'orbit').qCam;
  w.texture(0.09);
  for (let j = 0; j < nr; j++) for (let i = 0; i < nc; i++) {
    const lock = i === li && j === lj;
    // the pose's own tumble, without the lock pulling it square
    const t = LOCK_CENTRE + 0.24 * (i + j);
    const qCube = lock ? qConj(cam) : qMul(qAxis([0.35, 1, 0.2], t * 1.05), qAxis([1, 0, 0], 0.6));
    let cells = renderLogo({ cols: tile, rows: tile, ss: 2 }, { ...CUBE_ONLY, span: 0.95 }, { qCam: cam, qCube, S: 1, w: lock ? 1 : 0 });
    if (!lock) cells = cells.map((d) => d && { ...d, lum: d.lum * 0.5 });
    w.cells(cells, tile, tile, gi0 + i * tile, gj0 + j * tile);
  }
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.022 : 0.012));
  const pad = w.cell * 4, y = w.cell * (portrait ? 14 : 5) + fs;
  label(w, pad, y, 'FIGMENT ENGINEERING', fs, 'start', 0.7);
  label(w, pad, y + fs * 1.4, `FIELD · ${nc * nr} SAMPLES · 1 LOCK`, fs, 'start', 0.45);
  marks(w);
}

/** 9 · Decode: the screen as glyph noise, thinning toward a clearing where the name has already resolved */
function decode(w: Wall) {
  const portrait = w.H > w.W;
  const rng = mulberry32(11);
  // the resolved centre: the name in its frame
  const title = Math.round(Math.min(w.W, w.H) * (portrait ? 0.11 : 0.08));
  const cx = w.W / 2, cy = portrait ? w.H * 0.6 : w.H * 0.5;
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.022 : 0.0135));
  const fw = Math.min(w.W * 0.86, title * 8), fh = title * 4;
  // the frame in whole characters, its lines centred on (cx, cy): the side strokes sit mid-cell, the rules ≈ 0.3 em above the baseline
  const fcols = Math.floor(fw / (fs * ADVANCE)), frows = Math.floor(fh / fs);
  const halfW = (fcols * fs * ADVANCE) / 2 + fs, halfH = ((frows - 1) * fs) / 2 + fs * 1.5;
  // the glyph grid: a character every 1.5 dots across and 3 down
  const gfs = (w.cell * 1.5) / ADVANCE, rowH = w.cell * 3;
  const cols = Math.floor(w.W / (gfs * ADVANCE)), rows = Math.floor(w.H / rowH);
  const x0 = (w.W - cols * gfs * ADVANCE) / 2;
  const marksTop = w.H - w.cell * (portrait ? 8 : 4) - fs * 3;
  const NAME = 'FIGMENTENGINEERING';
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  for (let r = 0; r < rows; r++) {
    const y = (r + 0.75) * rowH;
    const runs: [number, string][] = [];
    for (let c = 0; c < cols; c++) {
      const x = x0 + (c + 0.5) * gfs * ADVANCE;
      const d = Math.hypot((x - cx) / (fw * 0.62), (y - cy) / (fh * 0.72));
      const s = d + (rng() - 0.5) * 0.35;
      const m = Math.max(0, Math.min(1, (s - 1.1) / 1.4));
      let ch = ' ', a = 0;
      // clear of the corner marks; on a narrow screen they nearly meet, so clear the whole band
      const inMarks = y > marksTop && (portrait || x < w.W * 0.22 || x > w.W * 0.78);
      // quieter behind the lock-screen clock
      const hush = portrait && y < w.H * 0.35 ? 0.5 : 1;
      const inFrame = Math.abs(x - cx) < halfW && Math.abs(y - cy) < halfH;
      if (!inMarks && !inFrame && s >= 1.1) {
        // right at the clearing's edge a few letters of the name are landing
        if (s < 1.22 && rng() < 0.12) { ch = NAME[Math.floor(rng() * NAME.length)]; a = 0.7; }
        else if (rng() < 0.2 + 0.65 * m) { ch = GLYPHS[Math.floor(rng() * GLYPHS.length)]; a = Math.round((0.06 + 0.26 * m) * hush * 50) / 50; }
      }
      const last = runs[runs.length - 1];
      if (last && (ch === ' ' || last[0] === a)) last[1] += ch;
      else runs.push([a, ch]);
    }
    const spans = runs.map(([a, s]) => `<tspan fill-opacity="${a}">${esc(s)}</tspan>`).join('');
    w.raw(`<text x="${x0}" y="${y}" font-family="Departure Mono" font-size="${gfs.toFixed(2)}" fill="${FG}" xml:space="preserve">${spans}</text>`);
  }
  frame(w, cx - (fcols * fs * ADVANCE) / 2, cy - ((frows - 1) * fs) / 2 + fs * 0.3, fcols, frows, fs, '00 / FIGMENT ENGINEERING', '#4A4A4A');
  // the two lines' caps (≈ 0.72 em) to the last baseline, centred on cy
  const b1 = cy - (1.2 + 0.72) * title / 2 + 0.72 * title;
  w.text(cx, b1, 'Figment', title, { anchor: 'middle', family: 'Bitcount Prop Single' });
  w.text(cx, b1 + title * 1.2, 'Engineering', title, { anchor: 'middle', family: 'Bitcount Prop Single' });
  marks(w);
}

/** words into `n` lines, as even as they'll go: the split whose longest line is shortest */
function balance(text: string, n: number): string[] {
  const words = text.split(' ');
  let best: string[] = [text];
  const walk = (from: number, lines: string[]) => {
    if (lines.length === n - 1) {
      const all = [...lines, words.slice(from).join(' ')];
      if (best.length !== n || Math.max(...all.map((l) => l.length)) < Math.max(...best.map((l) => l.length))) best = all;
      return;
    }
    for (let k = from + 1; k < words.length; k++) walk(k, [...lines, words.slice(from, k).join(' ')]);
  };
  walk(0, []);
  return best;
}

/** Jersey 15's advance, as a fraction of the font size (measured on these lines; near enough for fitting, it's not monospaced) */
const JERSEY_ADVANCE = 0.43;

/** 10 · Principles: the About section's three principles, one to a frame, in the About name's face and colour */
function principles(w: Wall) {
  const portrait = w.H > w.W;
  w.texture(0.09);
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.02 : 0.0115));
  const lines = about.principles.map((p) => balance(p, 3));
  const longest = Math.max(...lines.flat().map((l) => l.length));
  const n = lines.length, gap = fs * 2;
  // frames across a landscape screen, stacked below the clock on a portrait one
  const ax = w.W * 0.05, aw = w.W * 0.9;
  const ay = portrait ? w.H * 0.34 : w.H * 0.27, ah = portrait ? w.H * 0.56 : w.H * 0.46;
  const pw = portrait ? aw : (aw - gap * (n - 1)) / n, ph = portrait ? (ah - gap * (n - 1)) / n : ah;
  const pad = fs * 2.5;
  const size = Math.floor(Math.min((pw - pad * 2) / (longest * JERSEY_ADVANCE), (ph - pad * 3) / 3.2));
  lines.forEach((ls, k) => {
    const px = portrait ? ax : ax + k * (pw + gap), py = portrait ? ay + k * (ph + gap) : ay;
    box(w, px, py, pw, ph, fs, `${String(k + 1).padStart(2, '0')} / PRINCIPLE`);
    // set low in the frame, like a caption block
    const lh = size * 1.02, y0 = py + ph - pad - lh * (ls.length - 1);
    // the About name's face and colour, chart and all
    ls.forEach((l, j) => w.text(px + pad, y0 + j * lh, l, size, { family: 'Jersey 15 Charted', fill: FG }));
  });
  const pad2 = w.cell * 4, top = w.cell * (portrait ? 14 : 5) + fs;
  label(w, pad2, top, 'FIGMENT ENGINEERING', fs, 'start', 0.7);
  label(w, pad2, top + fs * 1.4, 'PRINCIPLES · 3 OF 3', fs, 'start', 0.45);
  marks(w);
}

/** 11 · Boot: the studio as a machine starting up, the screen's own size in the self-test */
function boot(w: Wall) {
  const portrait = w.H > w.W;
  w.texture(0.07, { cx: 0.5, cy: 0.5, rx: 0.75, ry: 0.7, inner: 0.35 });
  const fs = Math.round(portrait ? w.W * 0.028 : Math.min(w.W, w.H) * 0.019);
  const lh = fs * 1.35;
  const check = (k: string, v: string) => `${(k + ' ').padEnd(12, '.')} ${v.padEnd(24)}`;
  const lines: [string, number, boolean?][] = [
    ['FIGMENT ENGINEERING BIOS v1.0', 0.9],
    ['(C) 2026 FIGMENT ENGINEERING, CPH', 0.45],
    ['', 0],
    [check('CPU', 'DOT MATRIX @ 0.11 R'), 0.55, true],
    [check('MEMORY', '640K'), 0.55, true],
    [check('DISPLAY', `${w.W}×${w.H}`), 0.55, true],
    [check('FONTS', '3 FACES'), 0.55, true],
    [check('MOUNT', '~/wallpapers'), 0.55, true],
    ['', 0],
    ['LOADING figment.engineering', 0.7],
    [`[${'█'.repeat(20)}${'░'.repeat(4)}]  83%`, 0.55],
    ['', 0],
    ['READY.', 0.9],
  ];
  // the log as one left-aligned block, centred on the screen (below the clock on a phone); the cursor is its last line
  const cols = Math.max(...lines.map(([t, , ok]) => t.length + (ok ? 2 : 0)));
  const x = (w.W - cols * fs * ADVANCE) / 2, blockH = lines.length * lh + fs;
  let y = (portrait ? w.H * 0.62 : w.H / 2) - blockH / 2 + fs * 0.8;
  for (const [text, opacity, ok] of lines) {
    if (text) w.text(x, y, text, fs, { opacity });
    if (ok) w.text(x + text.length * fs * ADVANCE, y, 'OK', fs, { opacity: 0.95 });
    y += lh;
  }
  // the block cursor, on the line after READY.
  w.raw(`<rect x="${x}" y="${y - fs * 0.82}" width="${fs * ADVANCE}" height="${fs}" fill="${FG}"/>`);
  marks(w);
}

/** 12 · Trail: the site's cursor trail drawn across the whole screen, one slow figure-eight, fading from its head */
function trail(w: Wall) {
  const portrait = w.H > w.W;
  w.texture(0.08);
  const c = w.cell;
  const cx = w.W / 2, cy = portrait ? w.H * 0.6 : w.H * 0.5;
  const A = portrait ? w.W * 0.36 : w.W * 0.34, B = portrait ? w.H * 0.24 : w.H * 0.32;
  // a figure-eight on its side (standing up in portrait)
  const at = (t: number): [number, number] => {
    const u = Math.sin(t), v = Math.sin(2 * t) * 0.9;
    return portrait ? [cx + A * v, cy + B * u] : [cx + A * u, cy + B * v];
  };
  // walk the curve lighting each cell it passes, as the trail does: a cell passed twice keeps the newer time
  const t0 = 2.2, t1 = t0 + Math.PI * 2 * 0.85, step = (c * 0.25) / Math.max(A, B);
  const lit = new Map<string, [number, number, number]>();
  for (let t = t0; t <= t1; t += step) {
    const [x, y] = at(t);
    const i = Math.floor(x / c), j = Math.floor(y / c);
    lit.delete(`${i},${j}`);
    lit.set(`${i},${j}`, [i, j, (t - t0) / (t1 - t0)]);
  }
  for (const [i, j, f] of lit.values()) {
    const k = f ** 1.6;
    w.raw(`<circle cx="${(i + 0.5) * c}" cy="${(j + 0.5) * c}" r="${(c * (0.16 + 0.28 * k)).toFixed(2)}" fill="${FG}" fill-opacity="${(0.14 + 0.86 * k).toFixed(3)}"/>`);
  }
  // the head's position, read out just ahead of it, where the trail hasn't been yet
  const [hx, hy] = at(t1), [px, py] = at(t1 - 0.01);
  const dl = Math.hypot(hx - px, hy - py) || 1, dx = (hx - px) / dl, dy = (hy - py) / dl;
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.022 : 0.012));
  label(w, hx + dx * c * 3, hy + dy * c * 3 + fs * 0.35, `X ${Math.round(hx)} · Y ${Math.round(hy)}`, fs, dx < 0 ? 'end' : 'start', 0.6);
  marks(w);
}

/** value noise on a seeded lattice, smoothed, in [0, 1] */
function valueNoise(seed: number) {
  const rng = mulberry32(seed), N = 256;
  const table = Array.from({ length: N * N }, () => rng());
  const v = (i: number, j: number) => table[(((j % N) + N) % N) * N + (((i % N) + N) % N)];
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const i = Math.floor(x), j = Math.floor(y), u = s(x - i), q = s(y - j);
    const a = v(i, j) + (v(i + 1, j) - v(i, j)) * u, b = v(i, j + 1) + (v(i + 1, j + 1) - v(i, j + 1)) * u;
    return a + (b - a) * q;
  };
}

/** 13 · Texture: the background grid alone, its dots swelling and shrinking over a slow field: a halftone of nothing */
function texture(w: Wall) {
  const portrait = w.H > w.W;
  const SEED = 0x1f, noise = valueNoise(SEED);
  const c = w.cell, cols = Math.ceil(w.W / c), rows = Math.ceil(w.H / c);
  // the field's scale follows the screen, so every device gets the same few swells
  const period = Math.max(w.W, w.H) / 3.2;
  const ss = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = (i + 0.5) * c, y = (j + 0.5) * c;
    const n = noise(x / period, y / period) * 0.6 + noise(x / period * 2.1 + 17, y / period * 2.1) * 0.28 + noise(x / period * 4.3 + 41, y / period * 4.3) * 0.12;
    const k = ss(0.52, 0.86, n);
    w.raw(`<circle cx="${x}" cy="${y}" r="${(c * (0.1 + 0.3 * k)).toFixed(2)}" fill="#fff" fill-opacity="${(0.06 + 0.18 * k).toFixed(3)}"/>`);
  }
  const fs = Math.round(Math.min(w.W, w.H) * (portrait ? 0.022 : 0.012));
  const pad = w.cell * 4, top = w.cell * (portrait ? 14 : 5) + fs;
  label(w, pad, top, `TEXTURE · SEED 0x${SEED.toString(16).toUpperCase()}`, fs, 'start', 0.45);
  marks(w);
}

export const DESIGNS: Record<string, (w: Wall) => void> = {
  'fe-monolith': (w) => monolith(w),
  'fe-motion-study': study,
  'fe-homepage': homepage,
  'fe-macro': macro,
  'fe-blueprint': blueprint,
  'fe-field': field,
  'fe-decode': decode,
  'fe-principles': principles,
  'fe-boot': boot,
  'fe-trail': trail,
  'fe-texture': texture,
  'cw-bean': claudewitz,
  'cw-dissolve': dissolve,
};
