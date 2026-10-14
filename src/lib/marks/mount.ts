import { hashString, mulberry32 } from '../decode/rng';
import { paintCells, setupCanvas } from '../dotgrid/paint';
import { navLogoCells, SMALL_CELLS } from '../logo/nav';
import { prefersReducedMotion, register, type Handle } from '../motion/scheduler';
import { LOCK_CENTRE, logoTime } from '../render/pose';
import { reportError } from '../report';
import { shimmer } from './shimmer';
import { SC_COLS, SC_ROWS, smallclaimsCells } from './smallclaims';
import { copyrightFrame, LOCATION, locationFrame, WORDMARK, wordmarkFrame, wordmarkSeeds } from './text';

/** The cube mark: the small 28-cell logo at one CSS px a cell. */
export const CUBE_PX = SMALL_CELLS;

/**
 * The marks along the bottom of the hero. The server renders each finished (the copyright with a blank where
 * the cursor goes); this loops them. Under reduced motion they stay finished, with the cube still.
 */
export function mountHeroMarks(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-mark-cube]');
  const wordmark = root.querySelector<HTMLElement>('[data-mark-wordmark]');
  const location = root.querySelector<HTMLElement>('[data-mark-location]');
  const copyright = root.querySelector<HTMLElement>('[data-mark-copyright]');
  const year = copyright?.dataset.text ?? '';
  const scCanvas = root.querySelector<HTMLCanvasElement>('[data-mark-smallclaims] canvas');
  const letters = [...root.querySelectorAll<HTMLElement>('[data-mark-smallclaims] [data-letter]')];

  let handle: Handle | undefined;
  let failed = false;

  const fail = (err: unknown) => {
    if (failed) return;
    failed = true;
    reportError(err);
    root.setAttribute('data-fallback', '');
    if (wordmark) wordmark.textContent = WORDMARK;
    if (location) location.textContent = LOCATION;
    if (copyright) copyright.textContent = `${year} `;
    for (const l of letters) { l.style.opacity = ''; l.style.transform = ''; }
    handle?.stop();
    handle = undefined;
  };

  try {
    const ctx = canvas ? setupCanvas(canvas, CUBE_PX, CUBE_PX) : null;
    const spec = { cols: SMALL_CELLS, rows: SMALL_CELLS, cell: CUBE_PX / SMALL_CELLS, square: true, background: null };
    const scCtx = scCanvas ? setupCanvas(scCanvas, SC_COLS, SC_ROWS) : null;
    const scSpec = { cols: SC_COLS, rows: SC_ROWS, cell: 1, square: true, background: null };
    if (prefersReducedMotion()) {
      if (ctx) paintCells(ctx, spec, navLogoCells(LOCK_CENTRE, SMALL_CELLS));
      if (scCtx) paintCells(scCtx, scSpec, smallclaimsCells(null));
      return;
    }

    const rng = mulberry32(hashString('hero-marks'));
    const seeds = wordmarkSeeds(rng);
    let start: number | null = null; // seconds; every loop starts from the top when the hero first shows
    handle = register({
      el: root,
      fps: 12,
      frame: (now) => {
        if (failed) return;
        try {
          start ??= now;
          const t = now - start;
          if (ctx) paintCells(ctx, spec, navLogoCells(logoTime(now), SMALL_CELLS));
          if (wordmark) wordmark.textContent = wordmarkFrame(t, seeds, rng);
          if (location) location.textContent = locationFrame(t, rng);
          if (copyright) copyright.textContent = copyrightFrame(t, year);
          if (scCtx) paintCells(scCtx, scSpec, smallclaimsCells(t));
          letters.forEach((l, k) => {
            const { alpha, lift } = shimmer(t, k);
            l.style.opacity = String(alpha);
            l.style.transform = lift ? 'translateY(-1px)' : '';
          });
        } catch (err) {
          fail(err);
        }
      },
    });
    if (failed) handle.stop();
  } catch (err) {
    fail(err);
  }
}
