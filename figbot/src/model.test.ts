import { describe, expect, it } from 'vitest';
import { BG, DEFAULT_EYE, DEFAULT_POSE, HOLE, cells, gridFor, sample, type EyePose, type Pose } from './model';

// Left eye sits at (0.37, 0.45), base radii rx 0.105, ry 0.16; its inner side is +x.
const pose = (o: Partial<Pose>): Pose => ({ ...DEFAULT_POSE, ...o });
const bothEyes = (o: Partial<EyePose>): Pose['eyes'] => [{ ...DEFAULT_EYE, ...o }, { ...DEFAULT_EYE, ...o }];
const skin = (l: number) => l > 0 && l <= 1;

describe('sample', () => {
  it('is background outside the body', () => {
    expect(sample(DEFAULT_POSE, 0.02, 0.02)).toBe(BG);
  });

  it('is lit skin on the body', () => {
    expect(skin(sample(DEFAULT_POSE, 0.55, 0.8))).toBe(true);
  });

  it('cuts an oval hole at the eye centre', () => {
    expect(sample(DEFAULT_POSE, 0.37, 0.45)).toBe(HOLE);
  });

  it('lights the glint up and to the left of the eye centre', () => {
    expect(sample(DEFAULT_POSE, 0.3364, 0.3828)).toBe(1);
  });

  it('drops the glint when glint is off', () => {
    expect(sample(pose({ glint: false }), 0.3364, 0.3828)).toBe(HOLE);
  });

  it('arc (^): the centre is skin, the upper band is a hole', () => {
    const p = pose({ shape: 'arc' });
    expect(skin(sample(p, 0.37, 0.45))).toBe(true);
    expect(sample(p, 0.37, 0.3604)).toBe(HOLE);
  });

  it('chevron (>): the inward tip is a hole, the centre is skin', () => {
    const p = pose({ shape: 'chevron' });
    expect(sample(p, 0.44875, 0.45)).toBe(HOLE);
    expect(skin(sample(p, 0.37, 0.45))).toBe(true);
  });

  it('the upper lid hides the top of the eye', () => {
    const p = pose({ eyes: bothEyes({ lid: 0.72 }) });
    expect(skin(sample(p, 0.37, 0.33))).toBe(true);
    expect(sample(p, 0.37, 0.55)).toBe(HOLE);
  });

  it('slant lowers the outer corner of the lid (worried), not the inner', () => {
    const p = pose({ eyes: bothEyes({ lid: 0.3, slant: 1.4 }) });
    expect(sample(p, 0.43, 0.4)).toBe(HOLE);
    expect(skin(sample(p, 0.31, 0.4))).toBe(true);
  });

  it('the lower lid hides the bottom of the eye', () => {
    const p = pose({ eyes: bothEyes({ low: 0.38 }) });
    expect(skin(sample(p, 0.37, 0.55))).toBe(true);
    expect(sample(p, 0.37, 0.42)).toBe(HOLE);
  });

  it('squash keeps the body anchored at the bottom of the frame', () => {
    expect(skin(sample(pose({ squash: 0.07 }), 0.58, 0.99))).toBe(true);
  });

  it('tilt rotates the face about the body centre', () => {
    const p = pose({ tilt: 0.5 });
    expect(sample(p, 0.5156, 0.3799)).toBe(HOLE);
    expect(skin(sample(p, 0.37, 0.45))).toBe(true);
  });

  it.each(['oval', 'arc', 'chevron'] as const)('stays finite with %s eyes fully closed', (shape) => {
    for (const [u, v] of [[0.37, 0.45], [0.37, 0.3604], [0.44875, 0.45]]) {
      expect(Number.isFinite(sample(pose({ shape, open: 0 }), u, v))).toBe(true);
    }
  });
});

describe('cells', () => {
  it('samples cell centres row-major, sized to the rows by default', () => {
    const c = cells(DEFAULT_POSE, 4, 3);
    expect(c.length).toBe(12);
    expect(c[1 * 4 + 2]).toBe(sample(DEFAULT_POSE, 2.5 / 3, 1.5 / 3));
  });

  it('offsets the character frame', () => {
    const c = cells(DEFAULT_POSE, 4, 3, { x0: 1, y0: 0, size: 3 });
    expect(c[2]).toBe(sample(DEFAULT_POSE, 1.5 / 3, 0.5 / 3));
  });
});

describe('gridFor', () => {
  it('landscape: 48 rows, character centred horizontally', () => {
    expect(gridFor(1920, 1080)).toEqual({ cols: 86, rows: 48, cell: 22.5, frame: { x0: 19, y0: 0, size: 48 } });
  });

  it('portrait: 48 columns, character anchored to the bottom', () => {
    expect(gridFor(390, 844)).toEqual({ cols: 48, rows: 104, cell: 8.125, frame: { x0: 0, y0: 56, size: 48 } });
  });

  it('survives a zero-size window', () => {
    const g = gridFor(0, 0);
    expect(g.cols).toBeGreaterThanOrEqual(1);
    expect(g.rows).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(g.cell)).toBe(true);
  });
});
