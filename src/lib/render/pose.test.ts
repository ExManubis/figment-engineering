import { describe, expect, it } from 'vitest';
import { qMul, qRot } from './quat';
import { CYCLE, LOCK_CENTRE, lockWeight, logoTime, pose, POSE_OFFSET } from './pose';

const corners = (t: number) => {
  const { qCam } = pose(t, 'orbit');
  const pts: [number, number][] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const w = qRot(qCam, [x, y, z]);
    pts.push([w[0], w[1]]);
  }
  return pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};

describe('lockWeight', () => {
  it('is fully locked at the lock centre, every cycle', () => {
    expect(lockWeight(LOCK_CENTRE)).toBe(1);
    expect(lockWeight(LOCK_CENTRE + CYCLE)).toBe(1);
  });
  it('is released early in the cycle', () => expect(lockWeight(1)).toBe(0));
  it('eases in', () => {
    const w = lockWeight(3.95);
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThan(1);
  });
});

describe('pose', () => {
  it('turns the cube square to the viewer while locked', () => {
    const p = pose(LOCK_CENTRE, 'orbit');
    const front = qRot(qMul(p.qCam, p.qCube), [0, 0, -1]);
    [0, 0, -1].forEach((v, i) => expect(front[i]).toBeCloseTo(v, 6));
  });

  it('lands every focus lock on the same three-quarter view', () => {
    const a = corners(LOCK_CENTRE), b = corners(LOCK_CENTRE + CYCLE);
    a.forEach((pt, i) => { expect(pt[0]).toBeCloseTo(b[i][0], 6); expect(pt[1]).toBeCloseTo(b[i][1], 6); });
  });

  it('never shows the frame side-on at a lock (no two corners overlap)', () => {
    const pts = corners(LOCK_CENTRE);
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      expect(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])).toBeGreaterThan(0.2);
    }
  });

  it('tightens the brackets only when asked', () => {
    expect(pose(1, 'orbit').S).toBe(1);
    expect(pose(1, 'orbit', true).S).toBeCloseTo(1.08);
  });

  it('starts the logo clock offset so the first lock arrives about 1.5 s after load', () => {
    expect(logoTime(0)).toBe(POSE_OFFSET);
    expect(lockWeight(logoTime(1.9))).toBe(1);
  });
});
