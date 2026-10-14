import { clamp01, type DotCell } from '../dotgrid/paint';
import type { Pose } from './pose';
import { qConj, qRot, type Vec3 } from './quat';
import { makeLogoSdf, type LogoGeom } from './sdf';

const KEY: Vec3 = (() => {
  const l = Math.hypot(-0.5, 0.75, -0.45);
  return [-0.5 / l, 0.75 / l, -0.45 / l];
})();

/** Key light plus a rim term, for a world-space normal. */
export function shade(n: Vec3): number {
  const key = Math.max(0, n[0] * KEY[0] + n[1] * KEY[1] + n[2] * KEY[2]);
  return clamp01(0.1 + 0.9 * key + 0.28 * Math.pow(1 - Math.abs(n[2]), 2.2));
}

/** Sphere-trace the logo onto a square-celled grid. ss > 1 supersamples each cell (ss × ss rays). */
export function renderLogo(grid: { cols: number; rows: number; ss?: number }, g: LogoGeom, p: Pose): (DotCell | undefined)[] {
  const { cols, rows } = grid;
  const ss = grid.ss ?? 1;
  const sx = g.span / (cols / 2);
  const f = makeLogoSdf(g, p);
  const inv = qConj(p.qCam);
  const dir = qRot(inv, [0, 0, 1]);
  const out = new Array<DotCell | undefined>(cols * rows);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let cov = 0, lum = 0;
      for (let sj = 0; sj < ss; sj++) {
        for (let si = 0; si < ss; si++) {
          const wx = (i - cols / 2 + (si + 0.5) / ss) * sx;
          const wy = -(j - rows / 2 + (sj + 0.5) / ss) * sx;
          const o = qRot(inv, [wx, wy, -4]);
          let t = 0, dmin = Infinity, tmin = 0, hit = false;
          for (let k = 0; k < 72 && t < 8; k++) {
            const d = f(o[0] + dir[0] * t, o[1] + dir[1] * t, o[2] + dir[2] * t);
            if (d < dmin) { dmin = d; tmin = t; }
            if (d < 0.0015) { hit = true; break; }
            t += Math.max(d * 0.85, 0.002);
          }
          // near misses count as partial coverage: cheap anti-aliasing when not supersampling
          const c = hit ? 1 : ss > 1 ? 0 : clamp01(0.5 - dmin / (sx * 0.9));
          if (c <= 0) continue;
          const tt = hit ? t : tmin, e = 0.0025;
          const px = o[0] + dir[0] * tt, py = o[1] + dir[1] * tt, pz = o[2] + dir[2] * tt;
          const nx = f(px + e, py, pz) - f(px - e, py, pz);
          const ny = f(px, py + e, pz) - f(px, py - e, pz);
          const nz = f(px, py, pz + e) - f(px, py, pz - e);
          const nl = Math.hypot(nx, ny, nz) || 1;
          const rotated = qRot(p.qCam, [nx / nl, ny / nl, nz / nl]);
          const rotLen = Math.hypot(rotated[0], rotated[1], rotated[2]);
          const normal: Vec3 = rotLen > 0 ? [rotated[0] / rotLen, rotated[1] / rotLen, rotated[2] / rotLen] : rotated;
          lum += shade(normal) * c;
          cov += c;
        }
      }
      if (cov > 0) out[j * cols + i] = { cov: cov / (ss * ss), lum: lum / cov };
    }
  }
  return out;
}
