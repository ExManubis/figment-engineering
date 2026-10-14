import { paintCells, setupCanvas, type DotCell } from '../dotgrid/paint';
import { prefersReducedMotion, register } from '../motion/scheduler';
import { LOCK_CENTRE, logoTime, pose } from '../render/pose';
import { renderLogo } from '../render/raymarch';
import { NAV_CUBE_GEOM } from '../render/sdf';
import { reportError } from '../report';

export const NAV_CELLS = 28;
export const NAV_PX = 56;
const BRACKET_LUM = 0.8;

/** Four still 1-cell L-brackets; corners at `margin` cells from each edge, arms `len` cells long. */
export function hairlineBrackets(n = NAV_CELLS, margin = 3, len = 6): [number, number][] {
  const out: [number, number][] = [];
  const corners: [number, number, number, number][] = [
    [margin, margin, 1, 1], [n - 1 - margin, margin, -1, 1],
    [n - 1 - margin, n - 1 - margin, -1, -1], [margin, n - 1 - margin, 1, -1],
  ];
  for (const [ci, cj, dx, dy] of corners) {
    out.push([ci, cj]);
    for (let s = 1; s < len; s++) out.push([ci, cj + dy * s], [ci + dx * s, cj]);
  }
  return out;
}

const BRACKETS = hairlineBrackets();

/** The nav logo: the ray-traced cube (3 × 3 supersampled, swaying camera) inside still hairline brackets. */
export function navLogoCells(t: number): (DotCell | undefined)[] {
  const cells = renderLogo({ cols: NAV_CELLS, rows: NAV_CELLS, ss: 3 }, NAV_CUBE_GEOM, pose(t, 'sway'));
  for (const [i, j] of BRACKETS) cells[j * NAV_CELLS + i] = { cov: 1, lum: BRACKET_LUM };
  return cells;
}

/** Mounts the animated logo. Any failure is reported and leaves the static favicon fallback showing. */
export function mountNavLogo(canvas: HTMLCanvasElement): void {
  let stopped = false;
  let handle: { stop(): void } | undefined;
  const fail = (err: unknown): void => {
    reportError(err);
    canvas.closest('[data-nav-logo-link]')?.setAttribute('data-fallback', '');
    if (handle && !stopped) { stopped = true; handle.stop(); }
  };
  try {
    const ctx = setupCanvas(canvas, NAV_PX, NAV_PX);
    const spec = { cols: NAV_CELLS, rows: NAV_CELLS, cell: NAV_PX / NAV_CELLS, square: true, background: null };
    if (prefersReducedMotion()) {
      paintCells(ctx, spec, navLogoCells(LOCK_CENTRE));
      return;
    }
    handle = register({
      el: canvas,
      fps: 30,
      frame: (now) => {
        try { paintCells(ctx, spec, navLogoCells(logoTime(now))); } catch (err) { fail(err); }
      },
    });
  } catch (err) {
    fail(err);
  }
}
