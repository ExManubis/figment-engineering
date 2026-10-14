import { GRID, cells, type Pose } from '../../../figbot/src/model';
import { FG_COLOR, dotRadius } from '../../../figbot/src/svg';
import { poseAt } from '../../../figbot/src/timeline';
import { prefersReducedMotion, register, type Handle } from '../motion/scheduler';
import { reportError } from '../report';

/** Paints a pose as halftone dots filling a size×size square (CSS px). */
export function drawPose(ctx: CanvasRenderingContext2D, pose: Pose, size: number): void {
  const cell = size / GRID;
  const c = cells(pose, GRID, GRID);
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = FG_COLOR;
  ctx.beginPath();
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const r = dotRadius(c[j * GRID + i]) * cell;
      if (r <= 0) continue;
      const x = (i + 0.5) * cell, y = (j + 0.5) * cell;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}

/** Plays the Figbot loop over the server-rendered still; the still stays under reduced motion or on failure. */
export function mountFigbotDemo(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-figbot-canvas]');
  const still = root.querySelector<HTMLElement>('[data-figbot-still]');
  if (!canvas || !still || prefersReducedMotion()) return;

  let handle: Handle | undefined;
  let failed = false;
  // Failure falls back to the still. Reported once; the handle is stopped at most once.
  const fail = (err: unknown) => {
    if (failed) return;
    failed = true;
    reportError(err);
    handle?.stop();
    handle = undefined;
    canvas.hidden = true;
    still.hidden = false;
  };

  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('figbot demo: no 2D canvas context');
    let started: number | null = null; // seconds; the loop starts on the first visible frame
    handle = register({
      el: root,
      fps: 30,
      frame: (now) => {
        if (failed) return;
        try {
          started ??= now;
          const size = canvas.clientWidth, dpr = globalThis.devicePixelRatio || 1;
          const px = Math.round(size * dpr);
          if (canvas.width !== px) canvas.width = canvas.height = px;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawPose(ctx, poseAt(now - started), size);
          if (canvas.hidden) {
            canvas.hidden = false;
            still.hidden = true;
          }
        } catch (err) {
          fail(err);
        }
      },
    });
  } catch (err) {
    fail(err);
  }
}
