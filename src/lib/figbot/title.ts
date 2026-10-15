import { BG, HOLE, POSES, type Pose } from '../../../figbot/src/model';

/** The title's "o": Figbot's whole sphere on a small grid. */
export const TITLE_N = 15;

// The "o" is drawn on its own rather than through the model's peeking frame: at 15 cells the model's eyes
// shrink to 2×3 cells beside a specular blob, so the face stops reading. Same sphere, light and dot ramp,
// with bigger eyes and softer shading so the whole ball stays visible.
const LIGHT = (() => { const v = [-0.55, -0.65, 0.55]; const m = Math.hypot(...v); return v.map((x) => x / m); })();
const EYES = [[0.34, 0.45], [0.67, 0.42]] as const;
const RX = 0.11, RY = 0.19, GLINT_R = 0.05;
const GLANCE = 0.03;
const BLINK_EVERY = 4, BLINK = 0.09; // s; each blink ends as its 4 s cycle does, so t = 0 starts open

/** Idle with a blink every 4 s and a slow, small glance. */
export function titlePose(t: number): Pose {
  const b = t - BLINK_EVERY * Math.floor(t / BLINK_EVERY);
  const d = Math.abs(b - (BLINK_EVERY - BLINK));
  return {
    ...POSES.idle,
    gx: GLANCE * Math.sin((2 * Math.PI * t) / 7),
    open: d < BLINK ? Math.max(0.06, d / BLINK) : 1,
  };
}

/** BG outside the ball, HOLE in an eye, 1 on a glint, else the dot's luminance; row-major. Uses p.open, p.gx and p.glint. */
export function titleCells(p: Pose): Float64Array {
  const out = new Float64Array(TITLE_N * TITLE_N);
  const open = Math.max(p.open, 0.01);
  for (let j = 0; j < TITLE_N; j++) {
    for (let i = 0; i < TITLE_N; i++) {
      const u = (i + 0.5) / TITLE_N, v = (j + 0.5) / TITLE_N;
      const x = (u - 0.5) / 0.5, y = (v - 0.5) / 0.5, d2 = x * x + y * y;
      let lum: number = BG;
      if (d2 <= 1) {
        const z = Math.sqrt(1 - d2);
        lum = Math.min(1, 0.2 + 0.75 * Math.max(0, x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]));
        for (const [ex, ey] of EYES) {
          const dx = u - ex - p.gx, dy = v - ey;
          if ((dx / RX) ** 2 + (dy / (RY * open)) ** 2 >= 1) continue;
          lum = p.glint && p.open > 0.6 && Math.hypot(dx + RX * 0.3, dy + RY * 0.32) < GLINT_R ? 1 : HOLE;
        }
      }
      out[j * TITLE_N + i] = lum;
    }
  }
  return out;
}
