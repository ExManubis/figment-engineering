import portrait from '../../data/portrait.json';
import { scrollProgress } from '../decode/frame';
import { mulberry32 } from '../decode/rng';
import { paintCells, setupCanvas, type DotCell } from '../dotgrid/paint';
import { prefersReducedMotion, register, type Handle } from '../motion/scheduler';
import { reportError } from '../report';
import type { PortraitData } from './dither';

const CELL = 4;

export function mountPortrait(canvas: HTMLCanvasElement): void {
  let handle: Handle | undefined;
  let failed = false;
  // The no-JS state has no portrait: on failure hide it and let the About text stand alone.
  const fail = (err: unknown): void => {
    if (failed) return;
    failed = true;
    reportError(err);
    canvas.hidden = true;
    handle?.stop();
  };

  try {
    const { cols, rows, cells } = portrait as PortraitData;
    const ctx = setupCanvas(canvas, cols * CELL, rows * CELL);
    const spec = { cols, rows, cell: CELL, background: null };
    const rng = mulberry32(19);
    const seeds = cells.map(() => rng() * 0.9);
    const frameEl = canvas.closest<HTMLElement>('[data-decode-frame]') ?? canvas;

    const draw = (revealed: number) => {
      const out: (DotCell | undefined)[] = cells.map((v, k) => {
        if (v <= 0) return undefined;
        if (seeds[k] <= revealed) return { cov: 1, lum: v };
        return rng() < 0.15 ? { cov: 0.6, lum: rng() * 0.4 } : undefined; // noise before it resolves
      });
      paintCells(ctx, spec, out);
    };

    if (prefersReducedMotion()) {
      draw(1);
      return;
    }

    let revealed = 0;
    let finished = false;
    draw(0);
    handle = register({
      el: canvas,
      fps: 30,
      frame: () => {
        if (finished || failed) return;
        try {
          const r = frameEl.getBoundingClientRect();
          revealed = Math.max(revealed, scrollProgress(r.top, r.bottom, window.innerHeight));
          draw(revealed);
          if (revealed >= 1) finished = true;
        } catch (err) {
          fail(err);
        }
      },
    });
  } catch (err) {
    fail(err);
  }
}
