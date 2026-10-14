import { glyph, type Rng } from './rng';

/** Share of p each border cell spends as a flickering glyph before it settles. */
export const FRAME_BAND = 0.3;
/** Seconds to assemble a frame on gaining focus, and to dissolve it on losing focus. */
export const ASSEMBLE_S = 1.6;
export const DISSOLVE_S = 0.7;

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
  return { cols, rows, cells: pos.map(([x, y], i) => ({ x, y, ch: ch(x, y), seed: 0.5 * (i / n) + 0.2 * rng() })) };
}

export function renderFrame(layout: FrameLayout, p: number, rng: Rng): string {
  const grid = Array.from({ length: layout.rows }, () => new Array<string>(layout.cols).fill(' '));
  for (const c of layout.cells) grid[c.y][c.x] = p >= c.seed + FRAME_BAND ? c.ch : p >= c.seed ? glyph(rng) : ' ';
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

/** A section is in focus while it covers the middle fifth of the viewport. */
export function inFocus(top: number, bottom: number, vh: number): boolean {
  return top < vh * 0.6 && bottom > vh * 0.4;
}

/** Moves decode progress toward 1 while focused (over ASSEMBLE_S) and toward 0 otherwise (over DISSOLVE_S). */
export function stepProgress(p: number, focused: boolean, dt: number): number {
  return focused ? Math.min(1, p + dt / ASSEMBLE_S) : Math.max(0, p - dt / DISSOLVE_S);
}
