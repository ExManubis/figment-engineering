import { describe, expect, it } from 'vitest';
import { CELL, FADE_MS, Trail } from './trail';

describe('Trail', () => {
  it('lights the grid cell under the pointer', () => {
    const t = new Trail();
    t.add(25, 9, 0);
    expect(t.live(0)).toEqual([{ i: 2, j: 0, alpha: 1 }]);
    expect(CELL).toBe(10);
  });

  it('fades each dot linearly and drops it once faded', () => {
    const t = new Trail();
    t.add(5, 5, 0);
    expect(t.live(FADE_MS / 2)[0].alpha).toBeCloseTo(0.5);
    expect(t.live(FADE_MS)).toEqual([]);
    expect(t.size).toBe(0);
  });

  it('relights a cell the pointer passes over again', () => {
    const t = new Trail();
    t.add(5, 5, 0);
    t.add(6, 7, 400);
    expect(t.live(400)).toEqual([{ i: 0, j: 0, alpha: 1 }]);
    expect(t.size).toBe(1);
  });
});
