import { describe, expect, it } from 'vitest';
import { BG, HOLE } from '../../../figbot/src/model';
import { TITLE_N, titleCells, titlePose } from './title';

const at = (c: Float64Array, i: number, j: number) => c[j * TITLE_N + i];

describe('titleCells', () => {
  const c = titleCells(titlePose(1));

  it('frames the whole sphere: corners empty, every edge touched', () => {
    expect(c.length).toBe(TITLE_N * TITLE_N);
    for (const [i, j] of [[0, 0], [TITLE_N - 1, 0], [0, TITLE_N - 1], [TITLE_N - 1, TITLE_N - 1]]) expect(at(c, i, j)).toBe(BG);
    const lit = (cells: number[]) => cells.some((l) => l > 0);
    const row = (j: number) => Array.from({ length: TITLE_N }, (_, i) => at(c, i, j));
    const col = (i: number) => Array.from({ length: TITLE_N }, (_, j) => at(c, i, j));
    expect(lit(row(0)) && lit(row(TITLE_N - 1)) && lit(col(0)) && lit(col(TITLE_N - 1))).toBe(true);
  });

  it('keeps the two eyes apart: two separate eyes on every row through both', () => {
    for (const j of [5, 6, 7]) { // rows at v ≈ 0.37–0.50, inside both eyes
      // o = eye, g = glint (part of an eye), # = skin
      const row = Array.from({ length: TITLE_N }, (_, i) => { const l = at(c, i, j); return l === HOLE ? 'o' : l === 1 ? 'g' : l > 0 ? '#' : ' '; }).join('');
      const eyes = row.match(/[og]+/g) ?? [];
      expect(eyes.length, `row ${j}: ${row}`).toBe(2);
    }
  });

  it('shows two eyes, centred across the face', () => {
    const holes: number[] = [];
    for (let j = 0; j < TITLE_N; j++) for (let i = 0; i < TITLE_N; i++) if (at(c, i, j) === HOLE) holes.push(i);
    expect(holes.length).toBeGreaterThanOrEqual(4);
    const mean = holes.reduce((a, b) => a + b, 0) / holes.length;
    expect(Math.abs(mean - (TITLE_N - 1) / 2)).toBeLessThanOrEqual(1.5);
  });
});

describe('titlePose', () => {
  it('starts open, then blinks once every 4 s', () => {
    expect(titlePose(0).open).toBe(1);
    expect(titlePose(1).open).toBe(1);
    expect(titlePose(3.91).open).toBeLessThanOrEqual(0.1);
    expect(titlePose(7.91).open).toBeLessThanOrEqual(0.1);
  });

  it('only glances a little, and keeps the idle eyes', () => {
    const gxs = Array.from({ length: 50 }, (_, k) => titlePose(k * 0.3).gx);
    expect(Math.max(...gxs) - Math.min(...gxs)).toBeLessThanOrEqual(0.06 + 1e-12);
    expect(titlePose(2).shape).toBe('oval');
    expect(titlePose(2).glint).toBe(true);
  });
});
