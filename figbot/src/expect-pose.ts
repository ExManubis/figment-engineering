import { expect } from 'vitest';
import type { Pose } from './model';

/** Poses match: same shape and glint, every number equal to 6 decimals. */
export function expectPoseClose(a: Pose, b: Pose) {
  expect(a.shape).toBe(b.shape);
  expect(a.glint).toBe(b.glint);
  for (const k of ['open', 'gx', 'gy', 'tilt', 'squash', 'bob', 'exposure'] as const) expect(a[k], k).toBeCloseTo(b[k], 6);
  for (const e of [0, 1] as const) {
    for (const k of ['scale', 'sx', 'lid', 'low', 'slant'] as const) expect(a.eyes[e][k], `eyes[${e}].${k}`).toBeCloseTo(b.eyes[e][k], 6);
  }
}
