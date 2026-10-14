import { describe, expect, it } from 'vitest';
import { BG, DEFAULT_EYE, DEFAULT_POSE, EXPRESSIONS, GRID, HOLE, POSES, cells, gridFor, lerp, sample, type EyePose, type Pose } from './model';

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


describe('expressions', () => {
  it('lists the seven expressions in sheet order', () => {
    expect(EXPRESSIONS).toEqual(['idle', 'curious', 'happy', 'excited', 'thinking', 'sleepy', 'worried']);
  });

  const holes = (c: Float64Array) => c.reduce((n, l) => n + (l === HOLE ? 1 : 0), 0);

  it.each(EXPRESSIONS)('%s shows its eyes', (name) => {
    expect(holes(cells(POSES[name], GRID, GRID))).toBeGreaterThanOrEqual(10);
  });

  it('every pair of expressions differs clearly', () => {
    const grids = EXPRESSIONS.map(n => cells(POSES[n], GRID, GRID));
    for (let a = 0; a < grids.length; a++) {
      for (let b = a + 1; b < grids.length; b++) {
        let diff = 0;
        for (let i = 0; i < grids[a].length; i++) if ((grids[a][i] === HOLE) !== (grids[b][i] === HOLE)) diff++;
        expect(diff, `${EXPRESSIONS[a]} vs ${EXPRESSIONS[b]}`).toBeGreaterThanOrEqual(20);
      }
    }
  });

  it('uses the eye shape each expression is defined by', () => {
    expect(POSES.happy.shape).toBe('arc');
    expect(POSES.excited.shape).toBe('chevron');
    for (const n of ['idle', 'curious', 'thinking', 'sleepy', 'worried'] as const) expect(POSES[n].shape).toBe('oval');
  });
});

describe('lerp', () => {
  it('returns a at 0 and b at 1 exactly', () => {
    expect(lerp(POSES.idle, POSES.sleepy, 0)).toEqual(POSES.idle);
    expect(lerp(POSES.idle, POSES.sleepy, 1)).toEqual(POSES.sleepy);
  });

  it('blends numbers, including per-eye fields', () => {
    const p = lerp(POSES.idle, POSES.sleepy, 0.5);
    expect(p.tilt).toBeCloseTo(0.12, 10);
    expect(p.eyes[0].lid).toBeCloseTo(0.36, 10);
  });

  it('switches shape and glint at the halfway point', () => {
    expect(lerp(POSES.idle, POSES.happy, 0.49).shape).toBe('oval');
    expect(lerp(POSES.idle, POSES.happy, 0.5).shape).toBe('arc');
    expect(lerp(POSES.idle, POSES.sleepy, 0.49).glint).toBe(true);
    expect(lerp(POSES.idle, POSES.sleepy, 0.5).glint).toBe(false);
  });

  it('never mutates its inputs', () => {
    const before = structuredClone(POSES.idle);
    lerp(POSES.idle, POSES.happy, 0.3).eyes[0].lid = 9;
    expect(POSES.idle).toEqual(before);
  });
});
