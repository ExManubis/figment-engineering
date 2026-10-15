/** Live page: Figbot on a full-window canvas. Keys 1–7 hold an expression, 0 resumes the loop. */
import { POSES, cells, gridFor, type Pose } from './model';
import { createDriver } from './driver';
import { BG_COLOR, FG_COLOR, dotRadius } from './svg';

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;
const driver = createDriver();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const now = () => performance.now() / 1000;

function draw(pose: Pose) {
  // the canvas's own box, not innerWidth/innerHeight: mobile toolbars make 100vh ≠ innerHeight
  const w = canvas.clientWidth, h = canvas.clientHeight, dpr = devicePixelRatio || 1;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  const g = gridFor(w, h);
  const c = cells(pose, g.cols, g.rows, g.frame);
  ctx.fillStyle = FG_COLOR;
  ctx.beginPath();
  for (let j = 0; j < g.rows; j++) {
    for (let i = 0; i < g.cols; i++) {
      const r = dotRadius(c[j * g.cols + i]) * g.cell;
      if (r <= 0) continue;
      const x = (i + 0.5) * g.cell, y = (j + 0.5) * g.cell;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}

function frame() {
  if (reduced.matches) {
    draw(POSES.idle);
    return;
  }
  draw(driver.pose(now()));
  requestAnimationFrame(frame);
}

addEventListener('keydown', (e) => driver.press(e.key, now()));
addEventListener('resize', () => { if (reduced.matches) draw(POSES.idle); });
reduced.addEventListener('change', () => { if (!reduced.matches) requestAnimationFrame(frame); });
frame();
