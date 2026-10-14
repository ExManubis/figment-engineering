import { describe, expect, it } from 'vitest';
import { SHIMMER_LOOP_S, shimmer, waveAt } from './shimmer';

describe('shimmer', () => {
  it('leaves a column untouched when the wave is elsewhere', () => {
    expect(shimmer(0, 5)).toEqual({ alpha: 1, lift: 0 });
    expect(shimmer(SHIMMER_LOOP_S - 0.01, 0)).toEqual({ alpha: 1, lift: 0 });
  });

  it('dims and lifts a column most as the middle of the wave passes', () => {
    const t = (5 + 2 + 1.5) / 12; // the wave's middle on column 5
    expect(shimmer(t, 5).alpha).toBeCloseTo(0.35);
    expect(shimmer(t, 5).lift).toBe(1);
  });

  it('crosses the S (columns -2 to 0) before the letters, left to right', () => {
    const reached = (x: number) => {
      for (let t = 0; t < SHIMMER_LOOP_S; t += 0.01) if (shimmer(t, x).alpha < 1) return t;
      return Infinity;
    };
    expect(reached(-2)).toBeLessThan(reached(-1));
    expect(reached(-1)).toBeLessThan(reached(0));
    expect(reached(0)).toBeLessThan(reached(13));
    expect(reached(13)).toBeLessThan(SHIMMER_LOOP_S);
  });

  it('repeats every loop', () => {
    expect(waveAt(1)).toBeCloseTo(waveAt(1 + SHIMMER_LOOP_S));
  });
});
