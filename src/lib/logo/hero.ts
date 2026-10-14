import { decodeText, makeTextSeeds } from '../decode/text';
import { mulberry32 } from '../decode/rng';
import { paintCells, setupCanvas } from '../dotgrid/paint';
import { prefersReducedMotion, register, type Handle } from '../motion/scheduler';
import { LOCK_CENTRE, lockWeight, logoTime, pose } from '../render/pose';
import { renderLogo } from '../render/raymarch';
import { HERO_GEOM } from '../render/sdf';
import { reportError } from '../report';

const ASPECT = 430 / 560;
const MOTTO_SECONDS = 1.2;
const SLOW_MS = 50;
/** The slow-device guard judges a window only once it is this long and holds this many frames. */
const SLOW_WINDOW_MS = 2000;
const MIN_SAMPLES = 20;

export function mountHero(root: HTMLElement): void {
  const box = root.querySelector<HTMLElement>('[data-hero-logo]');
  const canvas = box?.querySelector('canvas');
  const motto = root.querySelector<HTMLElement>('[data-motto-decode]');
  if (!box || !canvas) return;

  let quality = 1;
  let cols = 0, rows = 0, cell = 0;
  let ctx: CanvasRenderingContext2D;

  const size = () => {
    const w = box.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    const base = window.innerWidth < 640 ? 60 : 124;
    const target = Math.max(24, Math.round(base * quality));
    // whole device pixels per cell, so the background grid does not moiré; cols refill the box
    cell = Math.max(1, Math.round((w / target) * dpr)) / dpr;
    cols = Math.max(1, Math.floor(w / cell));
    rows = Math.round(cols * ASPECT);
    ctx = setupCanvas(canvas, cols * cell, rows * cell);
  };
  const draw = (t: number) => paintCells(ctx, { cols, rows, cell, bgGrid: true }, renderLogo({ cols, rows }, HERO_GEOM, pose(t, 'orbit')));

  // motto: the real text is in an sr-only sibling; this aria-hidden copy is server-rendered dim,
  // decodes on the first focus lock and ends lit (fg)
  const text = motto?.dataset.text ?? '';
  const showMotto = () => {
    if (!motto) return;
    motto.textContent = text;
    motto.dataset.lit = '';
  };

  let handle: Handle | null = null;
  let failed = false;
  let stopped = false;

  // Single give-up path: report, show the still image, restore the motto, stop the scheduler once.
  const stopOnce = () => {
    if (stopped || !handle) return;
    stopped = true;
    handle.stop();
  };
  const fallBack = (err?: unknown) => {
    failed = true;
    if (err) reportError(err);
    box.dataset.fallback = '';
    showMotto();
    stopOnce();
  };

  try {
    size();
  } catch (err) {
    fallBack(err);
    return;
  }

  const rng = mulberry32(11);
  const seeds = makeTextSeeds(text, rng);

  if (prefersReducedMotion()) {
    showMotto();
    try {
      draw(LOCK_CENTRE);
    } catch (err) {
      fallBack(err);
    }
    return;
  }

  let mottoStart: number | null = null;
  let mottoDone = false;

  let samples = 0, totalMs = 0, windowStart = performance.now();

  window.addEventListener('resize', () => {
    if (failed) return;
    try { size(); } catch (err) { fallBack(err); }
  });

  handle = register({
    el: box,
    fps: 30,
    frame: (now, dt) => {
      if (failed) return;
      try {
        // dt = 0: first run or resume after a pause; time spent paused is not a slow frame
        if (dt === 0) { samples = 0; totalMs = 0; windowStart = performance.now(); }
        const t = logoTime(now);
        const start = performance.now();
        draw(t);
        totalMs += performance.now() - start;
        samples++;

        // slow-device guard: coarser grid first, then the still image
        if (samples >= MIN_SAMPLES && start - windowStart > SLOW_WINDOW_MS) {
          if (totalMs / samples > SLOW_MS) {
            if (quality === 1) {
              quality = 0.6;
              size();
            } else {
              fallBack();
              return;
            }
          }
          samples = 0; totalMs = 0; windowStart = start;
        }

        if (motto && !mottoDone) {
          if (mottoStart === null && lockWeight(t) > 0.5) mottoStart = now;
          if (mottoStart !== null) {
            const p = (now - mottoStart) / MOTTO_SECONDS;
            motto.textContent = decodeText(text, seeds, Math.min(1, p), rng);
            if (p > 0.5) motto.dataset.lit = '';
            if (p >= 1) mottoDone = true;
          }
        }
      } catch (err) {
        fallBack(err);
      }
    },
  });
  // if a failure happened before the handle existed (synchronous first frame), stop now
  if (failed) stopOnce();
}
