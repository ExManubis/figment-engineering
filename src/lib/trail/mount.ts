import { setupCanvas } from '../dotgrid/paint';
import { prefersReducedMotion } from '../motion/scheduler';
import { reportError } from '../report';
import { CELL, Trail } from './trail';

const COLOR = '#EDEDED';
const RADIUS = CELL * 0.36;

/**
 * The cursor trail: a dot lights up in each 10px grid cell the pointer passes over and fades out.
 * Desktop pointers only, and never under reduced motion. It only draws while dots are fading.
 */
export function mountTrail(canvas: HTMLCanvasElement): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || prefersReducedMotion()) return;

  const trail = new Trail();
  let ctx: CanvasRenderingContext2D;
  let raf = 0;
  let failed = false;

  const fail = (err: unknown) => {
    if (failed) return;
    failed = true;
    reportError(err);
    canvas.hidden = true;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('resize', size);
  };

  function size() {
    try {
      ctx = setupCanvas(canvas, window.innerWidth, window.innerHeight);
    } catch (err) {
      fail(err);
    }
  }

  const draw = () => {
    if (failed) return;
    try {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = COLOR;
      for (const d of trail.live(performance.now())) {
        ctx.globalAlpha = d.alpha;
        ctx.beginPath();
        ctx.arc(d.i * CELL + CELL / 2, d.j * CELL + CELL / 2, RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = trail.size ? requestAnimationFrame(draw) : 0;
    } catch (err) {
      fail(err);
    }
  };

  function onMove(e: MouseEvent) {
    trail.add(e.clientX, e.clientY, performance.now());
    if (!raf) raf = requestAnimationFrame(draw);
  }

  size();
  if (failed) return;
  window.addEventListener('resize', size);
  window.addEventListener('mousemove', onMove);
}
