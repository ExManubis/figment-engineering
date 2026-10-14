import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';
import { layoutFrame, renderFrame, scrollProgress } from './frame';

describe('layoutFrame + renderFrame', () => {
  it('draws a complete box with the label in the top border at p = 1', () => {
    const layout = layoutFrame(8, 3, 'AB', mulberry32(1));
    expect(renderFrame(layout, 1, mulberry32(2))).toBe('┌─ AB ─┐\n│      │\n└──────┘');
  });

  it('draws nothing at p = 0', () => {
    const layout = layoutFrame(8, 3, 'AB', mulberry32(1));
    expect(renderFrame(layout, 0, mulberry32(2))).toBe('        \n        \n        ');
  });

  it('is deterministic for the same seeds', () => {
    const a = renderFrame(layoutFrame(20, 6, '01 / X', mulberry32(9)), 0.5, mulberry32(3));
    const b = renderFrame(layoutFrame(20, 6, '01 / X', mulberry32(9)), 0.5, mulberry32(3));
    expect(a).toBe(b);
  });

  it('truncates a label that is too long for a narrow frame and keeps the corners', () => {
    const top = renderFrame(layoutFrame(10, 3, '01 / CLAUDEWITZ', mulberry32(1)), 1, mulberry32(2)).split('\n')[0];
    expect(top).toHaveLength(10);
    expect(top.startsWith('┌─')).toBe(true);
    expect(top.endsWith('─┐')).toBe(true);
  });

  it('returns an empty layout for degenerate sizes without throwing', () => {
    for (const [c, r] of [[0, 0], [3, 10], [10, 1], [-5, -5]]) {
      const layout = layoutFrame(c, r, 'X', mulberry32(1));
      expect(layout.cells).toEqual([]);
      expect(() => renderFrame(layout, 1, mulberry32(1))).not.toThrow();
    }
  });
});

describe('scrollProgress', () => {
  const vh = 1000;
  it('is 0 below the viewport', () => expect(scrollProgress(1000, 1600, vh)).toBe(0));
  it('is 1 once the top reaches 72 % of the viewport', () => expect(scrollProgress(720, 1320, vh)).toBe(1));
  it('ramps in from the bottom', () => expect(scrollProgress(860, 1460, vh)).toBeCloseTo(0.5));
  it('stays 1 while a tall section covers the whole viewport', () => expect(scrollProgress(-500, 1500, vh)).toBe(1));
  it('ramps out through the top 30 %', () => expect(scrollProgress(-600, 150, vh)).toBeCloseTo(0.5));
  it('is 0 above the viewport', () => expect(scrollProgress(-900, -1, vh)).toBe(0));
});
