import { describe, expect, it } from 'vitest';
import pixels from '../../data/smallclaims-pixels.json';
import { SC_COLS, SC_ROWS, smallclaimsCells } from './smallclaims';

const lit = (cells: ReturnType<typeof smallclaimsCells>) => cells.flatMap((c, k) => (c ? [{ k, alpha: c.alpha }] : []));

describe('smallclaimsCells', () => {
  it('draws every pixel of the S, one row down to leave room for the lift, at full strength when still', () => {
    const cells = smallclaimsCells(null);
    expect(cells).toHaveLength(SC_COLS * SC_ROWS);
    expect(SC_ROWS).toBe(pixels.rows + 1);
    expect(lit(cells)).toHaveLength(pixels.px.length);
    for (const [i, j] of pixels.px) expect(cells[(j + 1) * SC_COLS + i]).toMatchObject({ cov: 1, alpha: 1, color: '#EDEDED' });
  });

  it('dims and lifts the columns under the wave, and keeps every pixel', () => {
    const t = (1 + 1.5) / 12; // the wave's middle on the S's middle
    const cells = lit(smallclaimsCells(t));
    expect(cells).toHaveLength(pixels.px.length);
    expect(cells.some((c) => (c.alpha ?? 1) < 1)).toBe(true);
    // the S's top pixel is in its middle column, so it is lifted into the spare top row
    expect(smallclaimsCells(t).slice(0, SC_COLS).some(Boolean)).toBe(true);
  });
});
