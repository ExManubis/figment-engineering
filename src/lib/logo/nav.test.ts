import { describe, expect, it } from 'vitest';
import { LOCK_CENTRE } from '../render/pose';
import { hairlineBrackets, NAV_CELLS, navLogoCells } from './nav';

describe('hairlineBrackets', () => {
  it('draws four L-shaped 1-cell brackets inside the grid', () => {
    const cells = hairlineBrackets();
    expect(cells).toHaveLength(4 * (2 * 6 - 1));
    for (const [i, j] of cells) {
      expect(i).toBeGreaterThanOrEqual(0); expect(i).toBeLessThan(NAV_CELLS);
      expect(j).toBeGreaterThanOrEqual(0); expect(j).toBeLessThan(NAV_CELLS);
    }
    const key = new Set(cells.map(([i, j]) => `${i},${j}`));
    for (const corner of ['3,3', '24,3', '24,24', '3,24']) expect(key.has(corner)).toBe(true);
  });
});

describe('navLogoCells', () => {
  it('has the cube in the middle and grey brackets at the corners', () => {
    const cells = navLogoCells(LOCK_CENTRE);
    expect(cells).toHaveLength(NAV_CELLS * NAV_CELLS);
    expect(cells[14 * NAV_CELLS + 14]).toBeDefined();
    expect(cells[3 * NAV_CELLS + 3]).toEqual({ cov: 1, lum: 0.8 });
    expect(cells[0]).toBeUndefined();
  });

  it('keeps the brackets still while the cube moves', () => {
    const a = navLogoCells(1), b = navLogoCells(2.3);
    for (const [i, j] of hairlineBrackets()) expect(a[j * NAV_CELLS + i]).toEqual(b[j * NAV_CELLS + i]);
  });
});
