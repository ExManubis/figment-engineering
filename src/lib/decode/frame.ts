import { glyph, type Rng } from './rng';

export interface FrameCell { x: number; y: number; ch: string; seed: number }
export interface FrameLayout { cols: number; rows: number; cells: FrameCell[] }

/** Perimeter cells of a box-drawing frame, clockwise from the top-left, each with a decode seed. */
export function layoutFrame(cols: number, rows: number, label: string, rng: Rng): FrameLayout {
  cols = Math.max(0, Math.floor(cols));
  rows = Math.max(0, Math.floor(rows));
  if (cols < 4 || rows < 2) return { cols, rows, cells: [] };

  const pos: [number, number][] = [];
  for (let x = 0; x < cols; x++) pos.push([x, 0]);
  for (let y = 1; y < rows; y++) pos.push([cols - 1, y]);
  for (let x = cols - 2; x >= 0; x--) pos.push([x, rows - 1]);
  for (let y = rows - 2; y > 0; y--) pos.push([0, y]);

  const text = ` ${label} `.slice(0, cols - 4);
  const ch = (x: number, y: number): string => {
    if (y === 0 && x >= 2 && x < 2 + text.length) return text[x - 2];
    if (y === 0) return x === 0 ? '┌' : x === cols - 1 ? '┐' : '─';
    if (y === rows - 1) return x === 0 ? '└' : x === cols - 1 ? '┘' : '─';
    return '│';
  };
  const n = pos.length;
  return { cols, rows, cells: pos.map(([x, y], i) => ({ x, y, ch: ch(x, y), seed: 0.6 * (i / n) + 0.25 * rng() })) };
}

export function renderFrame(layout: FrameLayout, p: number, rng: Rng): string {
  const grid = Array.from({ length: layout.rows }, () => new Array<string>(layout.cols).fill(' '));
  for (const c of layout.cells) grid[c.y][c.x] = p >= c.seed + 0.12 ? c.ch : p >= c.seed ? glyph(rng) : ' ';
  return grid.map((r) => r.join('')).join('\n');
}

/**
 * Decode progress for a section from its bounding box:
 * 0 → 1 while its top moves from the viewport bottom to 72 % height,
 * 1 → 0 while its bottom leaves through the top 30 %.
 */
export function scrollProgress(top: number, bottom: number, vh: number): number {
  const enter = (vh - top) / (vh * 0.28);
  const exit = bottom / (vh * 0.3);
  return Math.max(0, Math.min(1, enter, exit));
}
