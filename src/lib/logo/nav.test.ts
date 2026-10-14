import { describe, expect, it } from 'vitest';
import { LOCK_CENTRE } from '../render/pose';
import { hairlineBrackets, NAV_CELLS, navBrackets, navLogoCells, SMALL_CELLS } from './nav';

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
  it('has the cube in the middle and grey brackets at the corners, on the 56-cell nav grid', () => {
    const cells = navLogoCells(LOCK_CENTRE);
    expect(NAV_CELLS).toBe(56);
    expect(cells).toHaveLength(NAV_CELLS * NAV_CELLS);
    expect(cells[28 * NAV_CELLS + 28]).toBeDefined();
    expect(cells[6 * NAV_CELLS + 6]).toEqual({ cov: 1, lum: 0.8 });
    expect(cells[0]).toBeUndefined();
  });

  it('scales the brackets with the grid, keeping them one cell thick', () => {
    expect(navBrackets(SMALL_CELLS)).toEqual(hairlineBrackets());
    expect(navBrackets(NAV_CELLS)).toHaveLength(4 * (2 * 12 - 1));
  });

  it('draws the small 28-cell version for the favicon and the hero mark', () => {
    const cells = navLogoCells(LOCK_CENTRE, SMALL_CELLS);
    expect(cells).toHaveLength(SMALL_CELLS * SMALL_CELLS);
    expect(cells[3 * SMALL_CELLS + 3]).toEqual({ cov: 1, lum: 0.8 });
  });

  it('keeps the brackets still while the cube moves', () => {
    const a = navLogoCells(1), b = navLogoCells(2.3);
    for (const [i, j] of navBrackets(NAV_CELLS)) expect(a[j * NAV_CELLS + i]).toEqual(b[j * NAV_CELLS + i]);
  });
});
