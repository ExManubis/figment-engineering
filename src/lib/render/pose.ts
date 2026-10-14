import { qAxis, qConj, qMul, qSlerp, type Quat } from './quat';

export interface Pose {
  /** object → world (camera looks along +z, y up) */
  qCam: Quat;
  /** cube local → object */
  qCube: Quat;
  /** bracket distance from the centre */
  S: number;
  /** focus-lock weight 0..1 */
  w: number;
}

export type CameraMode = 'orbit' | 'sway';

export const CYCLE = 7;
export const POSE_OFFSET = 2.4;
export const LOCK_CENTRE = 4.85;

const smooth = (x: number) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };

export function lockWeight(t: number): number {
  const c = ((t % CYCLE) + CYCLE) % CYCLE;
  return smooth((c - 3.6) / 0.7) * (1 - smooth((c - 6.1) / 0.7));
}

/** Logo clock from page time, offset so the first focus lock lands ≈ 1.5 s after load. */
export const logoTime = (pageSeconds: number): number => pageSeconds + POSE_OFFSET;

export function pose(t: number, mode: CameraMode = 'orbit', tighten = false): Pose {
  const k = mode === 'orbit' ? 1 : 0.6;
  const qCam =
    mode === 'orbit'
      ? // a quarter turn per cycle: the frame is symmetric, so every lock lands on the same three-quarter view
        qMul(
          qAxis([0, 1, 0], Math.PI / 4 + ((t - LOCK_CENTRE) * (Math.PI / 2)) / CYCLE),
          qAxis([1, 0, 0], -0.5 + Math.sin(((t - LOCK_CENTRE) * 2 * Math.PI) / CYCLE + Math.PI / 2) * 0.14),
        )
      : // gentle sway, never edge-on (nav logo)
        qMul(qAxis([0, 1, 0], Math.sin(t * 0.5) * 0.5), qAxis([1, 0, 0], -0.18 + Math.sin(t * 0.31) * 0.1));
  const w = lockWeight(t);
  const tumble = qMul(qAxis([0.35, 1, 0.2], t * k * 1.05), qAxis([1, 0, 0], 0.6));
  return { qCam, qCube: qSlerp(tumble, qConj(qCam), w), S: tighten ? 1 + 0.08 * (1 - w) : 1, w };
}
