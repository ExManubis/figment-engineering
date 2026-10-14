import { paintCells, setupCanvas, type DotCell } from '../dotgrid/paint';
import { prefersReducedMotion, register } from '../motion/scheduler';
import { LOCK_CENTRE, logoTime, pose } from '../render/pose';
import { renderLogo } from '../render/raymarch';
import { NAV_CUBE_GEOM } from '../render/sdf';
import { reportError } from '../report';

/** The nav logo: 56 cells across 56px, one CSS px a cell. */
export const NAV_CELLS = 56;
export const NAV_PX = 56;
/** The small logo (favicon, hero mark): 28 cells. */
export const SMALL_CELLS = 28;
const BRACKET_LUM = 0.8;

/** Four still 1-cell L-brackets; corners at `margin` cells from each edge, arms `len` cells long. */
export function hairlineBrackets(n = SMALL_CELLS, margin = 3, len = 6): [number, number][] {
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

/** The brackets for an n-cell logo: placed and sized as on the 28-cell one, and always one cell thick. */
export const navBrackets = (n: number): [number, number][] =>
  hairlineBrackets(n, Math.round((3 * n) / SMALL_CELLS), Math.round((6 * n) / SMALL_CELLS));

/**
 * The logo on an n × n grid: the ray-traced cube (swaying camera) inside still hairline brackets.
 * Small grids are supersampled 3 × 3; the 56-cell nav grid 2 × 2, as its finer cells need less.
 */
export function navLogoCells(t: number, n = NAV_CELLS): (DotCell | undefined)[] {
  const cells = renderLogo({ cols: n, rows: n, ss: n > SMALL_CELLS ? 2 : 3 }, NAV_CUBE_GEOM, pose(t, 'sway'));
  for (const [i, j] of navBrackets(n)) cells[j * n + i] = { cov: 1, lum: BRACKET_LUM };
  return cells;
}

/** Mounts the animated logo. Any failure is reported and leaves the static favicon fallback showing. */
export function mountNavLogo(canvas: HTMLCanvasElement): void {
  let stopped = false;
  let failed = false;
  let handle: { stop(): void } | undefined;
  const fail = (err: unknown): void => {
    if (failed) return;
    failed = true;
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
      fps: 20,
      frame: (now) => {
        try { paintCells(ctx, spec, navLogoCells(logoTime(now))); } catch (err) { fail(err); }
      },
    });
  } catch (err) {
    fail(err);
  }
}
