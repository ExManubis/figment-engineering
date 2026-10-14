import { describe, expect, it } from 'vitest';
import { RADIUS, Scatter } from './scatter';

// a 10 × 10 grid of 4px cells, every cell lit
const make = () => new Scatter(10, 10, 4, Array.from({ length: 100 }, (_, k) => k));
const offset = (s: Scatter, k: number) => Math.hypot(s.dx[k], s.dy[k]);

describe('Scatter', () => {
  it('starts settled, with every dot at home', () => {
    const s = make();
    expect(s.settled).toBe(true);
    expect(s.step(null, 1 / 30)).toBe(false);
    expect(s.dx.every((v) => v === 0)).toBe(true);
  });

  it('pushes dots near the pointer away from it, and leaves far ones alone', () => {
    const s = make();
    s.step({ x: 20, y: 20 }, 1 / 30);
    // cell (6, 5) sits at (26, 22): right of and below the pointer
    const k = 5 * 10 + 6;
    expect(s.dx[k]).toBeGreaterThan(0);
    expect(s.dy[k]).toBeGreaterThan(0);
    expect(s.settled).toBe(false);
    const far = new Scatter(100, 1, 4, [99]); // 398px away
    far.step({ x: 0, y: 2 }, 1 / 30);
    expect(far.dx[99]).toBe(0);
    expect(RADIUS).toBeLessThan(398);
  });

  it('springs every dot back home and settles once the pointer leaves', () => {
    const s = make();
    for (let i = 0; i < 10; i++) s.step({ x: 20, y: 20 }, 1 / 30);
    expect(Math.max(...Array.from({ length: 100 }, (_, k) => offset(s, k)))).toBeGreaterThan(2);
    let frames = 0;
    while (s.step(null, 1 / 30) && frames < 300) frames++;
    expect(frames).toBeLessThan(90); // under 3 s
    expect(s.settled).toBe(true);
    expect(s.dx.every((v) => v === 0) && s.dy.every((v) => v === 0)).toBe(true);
  });

  it('stays bounded under a pointer held still, at a low frame rate', () => {
    const s = make();
    for (let i = 0; i < 100; i++) s.step({ x: 21, y: 19 }, 0.1);
    for (let k = 0; k < 100; k++) expect(offset(s, k)).toBeLessThan(RADIUS);
  });

  it('only moves the dots it was given', () => {
    const s = new Scatter(10, 10, 4, [55]);
    s.step({ x: 20, y: 20 }, 1 / 30);
    expect(s.dx[54]).toBe(0);
    expect(s.dx[55]).not.toBe(0);
  });
});
