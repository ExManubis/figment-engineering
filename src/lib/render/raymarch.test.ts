import { describe, expect, it } from 'vitest';
import { LOCK_CENTRE, pose } from './pose';
import { renderLogo, shade } from './raymarch';
import { HERO_GEOM, NAV_CUBE_GEOM } from './sdf';

describe('renderLogo', () => {
  it('hits the cube in the centre and nothing in the corner', () => {
    const cells = renderLogo({ cols: 28, rows: 28, ss: 2 }, NAV_CUBE_GEOM, pose(LOCK_CENTRE, 'sway'));
    const centre = cells[14 * 28 + 14];
    expect(centre?.cov).toBe(1);
    expect(centre!.lum).toBeGreaterThan(0);
    expect(centre!.lum).toBeLessThanOrEqual(1);
    expect(cells[0]).toBeUndefined();
  });

  it('draws the brackets in the hero geometry', () => {
    const p = pose(LOCK_CENTRE, 'orbit');
    const withArms = renderLogo({ cols: 60, rows: 46 }, HERO_GEOM, p).filter(Boolean).length;
    const cubeOnly = renderLogo({ cols: 60, rows: 46 }, { ...HERO_GEOM, noArms: true }, p).filter(Boolean).length;
    expect(withArms).toBeGreaterThan(cubeOnly + 20);
  });

  it('gives edge cells partial coverage without supersampling (anti-aliasing)', () => {
    const cells = renderLogo({ cols: 60, rows: 46 }, HERO_GEOM, pose(LOCK_CENTRE, 'orbit'));
    expect(cells.some((c) => c && c.cov > 0 && c.cov < 1)).toBe(true);
  });
});

describe('shade', () => {
  it('stays within [0, 1]', () => {
    for (const n of [[0, 0, -1], [0, 1, 0], [1, 0, 0], [0, 0, 1]] as const) {
      const v = shade(n);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('handles numerical edge cases with z < -1 safely', () => {
    const v = shade([0, 0, -1.0000000000000002]);
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});
