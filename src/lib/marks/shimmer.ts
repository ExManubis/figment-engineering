/** One pass of the shimmer every this many seconds. */
export const SHIMMER_LOOP_S = 4;
/** How fast the wave travels, in columns (letters) per second. */
const SPEED = 12;
/** Where each pass starts: the S's left edge. The S spans columns -2 to 0, the letters 0, 1, 2… */
const START = -2;
/** The wave is this many columns wide. */
const WIDTH = 3;

/** The wave's leading edge, in columns, `t` seconds in. */
export const waveAt = (t: number): number => (t % SHIMMER_LOOP_S) * SPEED + START;

/**
 * How the shimmer shows on column `x` at `t` seconds: dimmed toward 35% and lifted 1px while the wave
 * passes over it, untouched otherwise.
 */
export function shimmer(t: number, x: number): { alpha: number; lift: 0 | 1 } {
  const d = waveAt(t) - x;
  if (d <= 0 || d >= WIDTH) return { alpha: 1, lift: 0 };
  return { alpha: 0.35 + (0.65 * Math.abs(WIDTH / 2 - d)) / (WIDTH / 2), lift: d > 0.5 && d < WIDTH - 0.5 ? 1 : 0 };
}
