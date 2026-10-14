import bean from '../../data/claudewitz-bean.json';
import { mulberry32 } from '../decode/rng';
import { paintCells, setupCanvas } from '../dotgrid/paint';
import { prefersReducedMotion, register, type Handle } from '../motion/scheduler';
import { reportError } from '../report';
import { cursorOn, terminalText, TRANSCRIPT } from './demo';
import { SparkField } from './field';
import { padBean, type BeanData } from './parse';

const CELL = 4;
/** Empty cells around the sprite so swirl orbits (radius up to ~28 cells) are not clipped. */
const PAD = 14;
const IDLE_S = 2;
const WORK_S = 2.6;

export function mountClaudewitzDemo(root: HTMLElement): void {
  const term = root.querySelector<HTMLElement>('[data-terminal]');
  const replay = root.querySelector<HTMLButtonElement>('[data-replay]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-bean]');
  if (!term || !canvas) return;

  let io: IntersectionObserver | undefined;
  let handle: Handle | undefined;
  let failed = false;

  // Failure leaves the no-JS state: the full transcript, no bean. Reported once; the handle is stopped at most once.
  const fail = (err: unknown) => {
    if (failed) return;
    failed = true;
    reportError(err);
    term.textContent = TRANSCRIPT;
    canvas.hidden = true;
    if (replay) replay.disabled = true;
    io?.disconnect();
    handle?.stop();
    handle = undefined;
  };

  try {
    const data: BeanData = padBean(bean as BeanData, PAD);
    const spec = { cols: data.cols, rows: data.rows, cell: CELL, background: null };
    const ctx = setupCanvas(canvas, data.cols * CELL, data.rows * CELL);
    const field = new SparkField(data, mulberry32(7));

    if (prefersReducedMotion()) {
      term.textContent = TRANSCRIPT;
      if (replay) replay.disabled = true; // nothing to replay
      paintCells(ctx, spec, field.cells());
      return;
    }

    let started: number | null = null; // seconds
    let phaseSince = 0;

    const restart = (now: number) => {
      started = now;
      phaseSince = 0;
      field.reset();
      term.textContent = '$ ';
      paintCells(ctx, spec, []);
    };

    // start when at least half the demo is on screen
    io = new IntersectionObserver((records) => {
      if (failed || started !== null || !records.some((r) => r.intersectionRatio >= 0.5)) return;
      try {
        restart(performance.now() / 1000);
        io?.disconnect();
      } catch (err) {
        fail(err);
      }
    }, { threshold: 0.5 });
    io.observe(root);

    replay?.addEventListener('click', () => {
      if (failed) return;
      try {
        restart(performance.now() / 1000);
      } catch (err) {
        fail(err);
      }
    });

    term.textContent = '$ ';
    handle = register({
      el: root,
      fps: 24,
      frame: (now) => {
        if (failed || started === null) return;
        try {
          const ms = (now - started) * 1000;
          const { text, done } = terminalText(ms);
          term.textContent = done ? text : text + (cursorOn(ms) ? '█' : ' ');
          if (!done) return;
          if (!phaseSince) phaseSince = now;

          const inPhase = now - phaseSince;
          if (field.mode === 'idle' && inPhase > IDLE_S) { field.dissolve(); phaseSince = now; }
          else if (field.mode === 'working' && inPhase > WORK_S) { field.gather(); phaseSince = now; }
          const wasGathering = field.mode === 'gathering';
          field.step();
          if (wasGathering && field.mode === 'idle') phaseSince = now;

          const bob = field.mode === 'idle' && Math.sin((now - phaseSince) * Math.PI * 2 * 0.9) > 0.55 ? -1 : 0;
          paintCells(ctx, spec, field.cells(bob));
        } catch (err) {
          fail(err);
        }
      },
    });
  } catch (err) {
    fail(err);
  }
}
