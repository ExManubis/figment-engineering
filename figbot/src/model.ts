/** Figbot: a halftone sphere with two eyes. Pure: pose in, luminance out. */

export type Shape = 'oval' | 'arc' | 'chevron';

export interface EyePose {
  scale: number;
  /** extra horizontal scale */
  sx: number;
  /** upper lid, 0..1 of the eye height */
  lid: number;
  /** lower lid, 0..1 of the eye height */
  low: number;
  /** raises the inner corner of the upper lid (worried) */
  slant: number;
}

export interface Pose {
  shape: Shape;
  /** 0..1 vertical openness of every eye shape (blink) */
  open: number;
  gx: number;
  gy: number;
  /** face rotation in radians about the body centre */
  tilt: number;
  /** + wider and shorter, − taller; anchored low */
  squash: number;
  bob: number;
  glint: boolean;
  exposure: number;
  eyes: [EyePose, EyePose];
}

export const BG = -1;
export const HOLE = 0;
export const GRID = 48;

export const DEFAULT_EYE: EyePose = { scale: 1, sx: 1, lid: 0, low: 0, slant: 0 };
export const DEFAULT_POSE: Pose = {
  shape: 'oval', open: 1, gx: 0, gy: 0, tilt: 0, squash: 0, bob: 0, glint: true, exposure: 1,
  eyes: [DEFAULT_EYE, DEFAULT_EYE],
};

const BODY = { cx: 0.58, cy: 0.7, R: 0.64 };
/** eye centre x, y and the sign of its inner side */
const SLOTS: readonly (readonly [number, number, number])[] = [[0.37, 0.45, 1], [0.69, 0.41, -1]];
const RX = 0.105, RY = 0.16;
const GLINT_R = 0.034, STROKE = 0.034, MIN_OPEN = 0.01;

const norm = (v: [number, number, number]) => { const m = Math.hypot(...v); return v.map(x => x / m) as [number, number, number]; };
const LIGHT = norm([-0.55, -0.65, 0.55]);
const HALF = norm([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);

const seg = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const vx = bx - ax, vy = by - ay;
  const k = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - ax - vx * k, py - ay - vy * k);
};

/** HOLE or 1 (glint) inside an eye, null on skin. (u, v) is in face space. */
function eyeAt(p: Pose, u: number, v: number): number | null {
  const open = Math.max(p.open, MIN_OPEN);
  for (let k = 0; k < 2; k++) {
    const [x0, y0, inner] = SLOTS[k];
    const e = p.eyes[k];
    const ex = x0 + p.gx, ey = y0 + p.gy;
    const rx = RX * e.scale * e.sx, ry = RY * e.scale;
    const dx = u - ex, dy = v - ey;
    if (Math.abs(dx) > rx * 1.3 || Math.abs(dy) > ry * 1.3) continue;

    if (p.shape === 'arc') {
      const d = Math.hypot(dx / rx, dy / (ry * 0.8 * open));
      if (dy < 0.02 && d < 1 && d > 0.42) return HOLE;
      continue;
    }
    if (p.shape === 'chevron') {
      const tx = ex + inner * rx * 0.75, bx = ex - inner * rx * 0.85, arm = ry * 0.7 * open;
      if (Math.min(seg(u, v, bx, ey - arm, tx, ey), seg(u, v, bx, ey + arm, tx, ey)) < STROKE) return HOLE;
      continue;
    }
    if ((dx / rx) ** 2 + (dy / (ry * open)) ** 2 >= 1) continue;
    const top = ey - ry + e.lid * 2 * ry - e.slant * inner * dx;
    const bottom = ey + ry - e.low * 2 * ry;
    if (v < top || v > bottom) continue;
    if (p.glint && p.open > 0.6 && e.lid < 0.25 && Math.hypot(dx + rx * 0.32, dy + ry * 0.42) < GLINT_R * e.scale) return 1;
    return HOLE;
  }
  return null;
}

/** BG outside the body, HOLE in an eye, otherwise the dot's luminance in (0, 1]. */
export function sample(p: Pose, u: number, v: number): number {
  const Rx = BODY.R * (1 + p.squash), Ry = BODY.R * (1 - p.squash);
  const cx = BODY.cx, cy = BODY.cy + p.bob + 0.6 * (BODY.R - Ry);
  const x = (u - cx) / Rx, y = (v - cy) / Ry;
  const d2 = x * x + y * y;
  if (d2 > 1) return BG;

  // face space: undo the tilt about the body centre; eyes ride along with bob and squash
  const c = Math.cos(-p.tilt), s = Math.sin(-p.tilt);
  const fu = cx + (u - cx) * c - (v - cy) * s;
  const fv = BODY.cy + (u - cx) * s + (v - cy) * c;
  const eye = eyeAt(p, fu, fv);
  if (eye !== null) return eye;

  const z = Math.sqrt(1 - d2);
  const ndl = Math.max(0, x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]);
  const ndh = Math.max(0, x * HALF[0] + y * HALF[1] + z * HALF[2]);
  const lum = 0.06 + 0.78 * ndl + 0.5 * ndh ** 40 + 0.12 * (1 - z) ** 3;
  return Math.min(1, Math.max(Number.MIN_VALUE, p.exposure * lum));
}

export interface Frame { x0: number; y0: number; size: number }

/** Sample every cell centre, row-major. The character frame is `size` cells square at (x0, y0). */
export function cells(p: Pose, cols: number, rows: number, frame: Frame = { x0: 0, y0: 0, size: rows }): Float64Array {
  const out = new Float64Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      out[j * cols + i] = sample(p, (i + 0.5 - frame.x0) / frame.size, (j + 0.5 - frame.y0) / frame.size);
    }
  }
  return out;
}

/** Grid for a window: GRID cells across its short side; centred when wide, bottom-anchored when tall. */
export function gridFor(width: number, height: number): { cols: number; rows: number; cell: number; frame: Frame } {
  const w = Math.max(1, width), h = Math.max(1, height);
  if (w >= h) {
    const cell = h / GRID, cols = Math.ceil(w / cell);
    return { cols, rows: GRID, cell, frame: { x0: Math.floor((cols - GRID) / 2), y0: 0, size: GRID } };
  }
  const cell = w / GRID, rows = Math.ceil(h / cell);
  return { cols: GRID, rows, cell, frame: { x0: 0, y0: rows - GRID, size: GRID } };
}

export type ExpressionName = 'idle' | 'curious' | 'happy' | 'excited' | 'thinking' | 'sleepy' | 'worried';

/** Sheet order; the live page maps keys 1–7 onto it. */
export const EXPRESSIONS: readonly ExpressionName[] = ['idle', 'curious', 'happy', 'excited', 'thinking', 'sleepy', 'worried'];

const eye = (o: Partial<EyePose> = {}): EyePose => ({ ...DEFAULT_EYE, ...o });
const pose = (o: Partial<Pose>): Pose => ({ ...DEFAULT_POSE, ...o });

export const POSES: Record<ExpressionName, Pose> = {
  idle: pose({}),
  curious: pose({ tilt: 0.2, gx: 0.035, gy: -0.03, eyes: [eye({ scale: 0.86, lid: 0.12 }), eye({ scale: 1.16 })] }),
  happy: pose({ shape: 'arc', squash: 0.05, bob: -0.02 }),
  excited: pose({ shape: 'chevron', squash: 0.07, bob: -0.03, tilt: -0.08 }),
  thinking: pose({ tilt: -0.1, gx: 0.04, gy: -0.06, glint: false, eyes: [eye({ scale: 0.95, low: 0.38 }), eye({ scale: 0.95, low: 0.38 })] }),
  sleepy: pose({ tilt: 0.24, gy: 0.025, glint: false, exposure: 0.7, bob: 0.02, eyes: [eye({ lid: 0.72 }), eye({ lid: 0.66 })] }),
  worried: pose({ gx: -0.02, gy: 0.03, squash: 0.03, eyes: [eye({ scale: 0.92, lid: 0.3, slant: 1.4 }), eye({ scale: 0.92, lid: 0.3, slant: 1.4 })] }),
};

// a·(1−k) + b·k is exact at both ends, unlike a + (b − a)·k
const mix = (a: number, b: number, k: number) => a * (1 - k) + b * k;
const lerpEye = (a: EyePose, b: EyePose, k: number): EyePose => ({
  scale: mix(a.scale, b.scale, k), sx: mix(a.sx, b.sx, k), lid: mix(a.lid, b.lid, k), low: mix(a.low, b.low, k), slant: mix(a.slant, b.slant, k),
});

/** Blend two poses. Numbers interpolate; shape and glint switch at k = 0.5. */
export function lerp(a: Pose, b: Pose, k: number): Pose {
  const late = k >= 0.5;
  return {
    shape: late ? b.shape : a.shape,
    open: mix(a.open, b.open, k),
    gx: mix(a.gx, b.gx, k),
    gy: mix(a.gy, b.gy, k),
    tilt: mix(a.tilt, b.tilt, k),
    squash: mix(a.squash, b.squash, k),
    bob: mix(a.bob, b.bob, k),
    glint: late ? b.glint : a.glint,
    exposure: mix(a.exposure, b.exposure, k),
    eyes: [lerpEye(a.eyes[0], b.eyes[0], k), lerpEye(a.eyes[1], b.eyes[1], k)],
  };
}
