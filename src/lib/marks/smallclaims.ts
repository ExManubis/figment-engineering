import type { DotCell } from '../dotgrid/paint';
import pixels from '../../data/smallclaims-pixels.json';
import { shimmer } from './shimmer';

const COLOR = '#EDEDED';

/** The smallclaims S's canvas grid: its pixels plus a spare row on top for the shimmer's lift. */
export const SC_COLS = pixels.cols;
export const SC_ROWS = pixels.rows + 1;

/**
 * The S as square cells `t` seconds into the shimmer, or still when `t` is null. Its columns sit
 * at -2 to 0 in the shimmer's units, so the wave crosses the S before the letters after it.
 */
export function smallclaimsCells(t: number | null): (DotCell | undefined)[] {
  const cells: (DotCell | undefined)[] = new Array(SC_COLS * SC_ROWS);
  for (const [i, j] of pixels.px as [number, number][]) {
    const { alpha, lift } = t === null ? { alpha: 1, lift: 0 } : shimmer(t, -2 + (i / SC_COLS) * 2);
    cells[(j + 1 - lift) * SC_COLS + i] = { cov: 1, lum: 1, color: COLOR, alpha };
  }
  return cells;
}
