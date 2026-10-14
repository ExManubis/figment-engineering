import type { Pose } from './pose';
import { qConj, qRot } from './quat';

export interface LogoGeom {
  arm: number;
  thickness: number;
  cube: number;
  bevel: number;
  /** half-width of the view in world units */
  span: number;
  /** brackets only in the z = 0 plane (four corners, two arms each) */
  flat?: boolean;
  /** cube only */
  noArms?: boolean;
}

export const HERO_GEOM: LogoGeom = { arm: 0.38, thickness: 0.026, cube: 0.4, bevel: 0.03, span: 1.92 };
export const NAV_CUBE_GEOM: LogoGeom = { arm: 0, thickness: 0, cube: 0.34, bevel: 0, span: 1.32, flat: true, noArms: true };

export function sdBox(x: number, y: number, z: number, bx: number, by: number, bz: number): number {
  const qx = Math.abs(x) - bx, qy = Math.abs(y) - by, qz = Math.abs(z) - bz;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0);
}

/** Signed distance to the logo in object space: crop-mark arms at the cube corners plus the bevelled centre cube. */
export function makeLogoSdf(g: LogoGeom, p: Pose): (x: number, y: number, z: number) => number {
  const qi = qConj(p.qCube), S = p.S, A = g.arm, T = g.thickness, C = g.cube - g.bevel;
  return (x, y, z) => {
    const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
    let arms = Infinity;
    if (!g.noArms) {
      arms = g.flat
        ? Math.min(sdBox(ax - (S - A / 2), ay - S, z, A / 2, T, T), sdBox(ax - S, ay - (S - A / 2), z, T, A / 2, T))
        : Math.min(
            sdBox(ax - (S - A / 2), ay - S, az - S, A / 2, T, T),
            sdBox(ax - S, ay - (S - A / 2), az - S, T, A / 2, T),
            sdBox(ax - S, ay - S, az - (S - A / 2), T, T, A / 2),
          );
    }
    const q = qRot(qi, [x, y, z]);
    return Math.min(arms, sdBox(q[0], q[1], q[2], C, C, C) - g.bevel);
  };
}
