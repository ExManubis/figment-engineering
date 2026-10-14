import portrait from '../../data/portrait.json';
import { inFocus, scrollProgress } from '../decode/frame';
import { mulberry32 } from '../decode/rng';
import { paintCells, setupCanvas, type DotCell } from '../dotgrid/paint';
import { prefersReducedMotion, register, type Handle } from '../motion/scheduler';
import { reportError } from '../report';
import type { PortraitData } from './dither';
import { Scatter } from './scatter';
import { whoamiText } from './whoami';

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
    const scatter = new Scatter(cols, rows, CELL, cells.flatMap((v, k) => (v > 0 ? [k] : [])));

    const draw = (revealed: number) => {
      const out: (DotCell | undefined)[] = cells.map((v, k) => {
        if (v <= 0) return undefined;
        if (seeds[k] <= revealed) return { cov: 0.35 + 0.65 * v, lum: v, dx: scatter.dx[k], dy: scatter.dy[k] };
        return rng() < 0.15 ? { cov: 0.6, lum: rng() * 0.4 } : undefined; // noise before it resolves
      });
      paintCells(ctx, spec, out);
    };

    if (prefersReducedMotion()) {
      draw(1);
      return;
    }

    // the pointer in the canvas's CSS px (it may be scaled down by a max-width), or null when it's away
    let pointer: { x: number; y: number } | null = null;
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      const scale = r.width ? (cols * CELL) / r.width : 1;
      pointer = { x: (e.clientX - r.left) * scale, y: (e.clientY - r.top) * scale };
    });
    // a touch ends with pointerup, or pointercancel once the page takes the gesture over for scrolling
    for (const type of ['pointerleave', 'pointercancel', 'pointerup'] as const) canvas.addEventListener(type, () => { pointer = null; });

    let revealed = 0;
    let finished = false;
    let moved = false;
    draw(0);
    handle = register({
      el: canvas,
      fps: 30,
      frame: (_t, dt) => {
        if (failed) return;
        try {
          const moving = scatter.step(pointer, dt ?? 0);
          if (finished) {
            // once resolved, only repaint while dots are off home, plus once more as they land
            if (moving || moved) draw(1);
            moved = moving;
            return;
          }
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

/**
 * The About title: `$ whoami` answered by the name, typed out the first time the section comes into focus.
 * Server-rendered with the full name, which reduced motion and failures keep.
 */
export function mountWhoami(root: HTMLElement): void {
  const nameEl = root.querySelector<HTMLElement>('[data-whoami-name]');
  const cursorEl = root.querySelector<HTMLElement>('[data-whoami-cursor]');
  if (!nameEl || !cursorEl || prefersReducedMotion()) return;
  const name = nameEl.textContent ?? '';
  let handle: Handle | undefined;
  let failed = false;
  const fail = (err: unknown): void => {
    if (failed) return;
    failed = true;
    reportError(err);
    nameEl.textContent = name;
    cursorEl.style.visibility = '';
    handle?.stop();
  };

  const frameEl = root.closest<HTMLElement>('[data-decode-frame]') ?? root;
  let start: number | null = null;
  nameEl.textContent = '';
  handle = register({
    el: root,
    fps: 30,
    frame: (t) => {
      if (failed) return;
      try {
        if (start === null) {
          const r = frameEl.getBoundingClientRect();
          if (inFocus(r.top, r.bottom, window.innerHeight)) start = t;
        }
        const { typed, cursor } = whoamiText(start === null ? null : t - start, name);
        if (nameEl.textContent !== typed) nameEl.textContent = typed;
        cursorEl.style.visibility = cursor ? '' : 'hidden';
      } catch (err) {
        fail(err);
      }
    },
  });
}
