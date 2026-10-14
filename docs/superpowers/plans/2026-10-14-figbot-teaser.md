# Figbot Teaser Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Figbot mascot as one pure TypeScript pose model, then render it into a reference set:
- hero stills
- an expression sheet
- a seamless MP4/GIF loop
- a self-contained live HTML page

**Architecture:** `figbot/src/model.ts` maps a `Pose` and a point to a luminance value. It is pure and has no I/O.

The other modules build on it:
- `timeline.ts` turns time into a pose for the 14 s loop.
- `driver.ts` adds keyboard control for the live page.
- `svg.ts` turns a cell grid into halftone SVG.

`render.ts` is a Node CLI. It rasterises the SVG with resvg, encodes video with ffmpeg and bundles the live page with esbuild. Everything lives in `figbot/` and nothing touches the site.

**Tech Stack:**
- TypeScript (strict, via the root `tsconfig.json`)
- Vitest 5
- tsx
- `@resvg/resvg-js`
- esbuild (already in `node_modules` as a vite dependency)
- ffmpeg/ffprobe (Homebrew, on PATH)

**Spec:** `docs/superpowers/specs/2026-10-14-figbot-teaser-design.md`

## Global Constraints

- Monochrome only: dots `#F2F2F2` on `#0A0A0A`.
- No wordmark on any output. The only text anywhere is the expression labels on `sheet.png`.
- No new dependencies in `package.json`.
- The only file changed outside `figbot/` is `vitest.config.ts`, which gains `'figbot/**/*.test.ts'`.
- `figbot/src/model.ts`, `timeline.ts`, `driver.ts` and `svg.ts` stay pure: no DOM, no filesystem, no clock.
- The grid is always 48 cells across the character frame (`GRID = 48`).
- The loop is `LOOP = 14` s at `FPS = 30`, which is 420 frames, and must be seamless.
- Outputs go to `figbot/out/` and are **committed**.
- Run commands from the repo root. Commit messages follow the repo style: `feat: …`, `test: …`, `chore: …`.

## Review Focus

These are the failure modes the spec implies but doesn't spell out. Each is pinned by a test in the task that owns the code.

1. **Odd live-page windows.** A portrait phone or an ultra-wide window should keep the character framed, anchored at the bottom and not stretched. Tested by `gridFor` in Task 1.
2. **Rapid key presses mid-transition.** Pressing 1 → 3 → 5 quickly must never make the pose jump; each press blends from what is currently on screen. Tested in Task 5.
3. **Resuming with `0` after holding.** The loop should pick up where it paused and blend in without a jump. Tested in Task 5.
4. **Any time value.** Negative values and values many loops in, as `performance.now()` produces, must wrap into the loop. Tested in Task 4.
5. **Eyes nearly or fully closed.** `open` at or near 0, in any shape, must give no NaN; the eyes collapse instead. Tested in Task 1.

---

## File Structure

| File | Responsibility |
|---|---|
| `figbot/src/model.ts` | `Pose` types, `DEFAULT_POSE`, `POSES` and `EXPRESSIONS`, `lerp`, `sample`, `cells`, `gridFor` |
| `figbot/src/model.test.ts` | Geometry, expression and lerp tests |
| `figbot/src/svg.ts` | `dotRadius`, `svgBody`, `toSvg`, colours |
| `figbot/src/svg.test.ts` | |
| `figbot/src/timeline.ts` | `KEYFRAMES`, `BLINKS`, `smoothstep`, `transition`, `stageAt`, `live`, `poseAt` |
| `figbot/src/timeline.test.ts` | |
| `figbot/src/expect-pose.ts` | Test helper: `expectPoseClose(a, b)` |
| `figbot/src/driver.ts` | Live-page state machine: loop, held expression, resume |
| `figbot/src/driver.test.ts` | |
| `figbot/src/live.ts` | DOM wiring: canvas, resize, keys, reduced motion |
| `figbot/render.ts` | CLI that writes every file in `figbot/out/` |
| `figbot/out/**` | Committed outputs |
| `vitest.config.ts` | Adds `figbot/**/*.test.ts` |

---

### Task 1: Model geometry (`sample`, `cells`, `gridFor`)

**Files:**
- Modify: `vitest.config.ts`
- Create: `figbot/src/model.ts`
- Test: `figbot/src/model.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces, used by every later task:
  - `type Shape = 'oval' | 'arc' | 'chevron'`
  - `interface EyePose { scale; sx; lid; low; slant }`: all fields are `number`.
  - `interface Pose { shape; open; gx; gy; tilt; squash; bob; glint; exposure; eyes }`
    - `glint: boolean`
    - `eyes: [EyePose, EyePose]`
    - every other field is `number`
  - `BG = -1`, `HOLE = 0`, `GRID = 48`
  - `DEFAULT_EYE`, `DEFAULT_POSE`
  - `sample(p: Pose, u: number, v: number): number`: returns `BG`, `HOLE` or a lum in `(0, 1]`.
  - `interface Frame { x0: number; y0: number; size: number }`
  - `cells(p: Pose, cols: number, rows: number, frame?: Frame): Float64Array`: row-major.
  - `gridFor(width: number, height: number): { cols: number; rows: number; cell: number; frame: Frame }`

- [ ] **Step 1: Add figbot tests to the vitest include**

In `vitest.config.ts`, change the include line to:

```ts
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'figbot/**/*.test.ts'],
```

- [ ] **Step 2: Write the failing tests**

Create `figbot/src/model.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BG, DEFAULT_EYE, DEFAULT_POSE, HOLE, cells, gridFor, sample, type EyePose, type Pose } from './model';

// Left eye sits at (0.37, 0.45), base radii rx 0.105, ry 0.16; its inner side is +x.
const pose = (o: Partial<Pose>): Pose => ({ ...DEFAULT_POSE, ...o });
const bothEyes = (o: Partial<EyePose>): Pose['eyes'] => [{ ...DEFAULT_EYE, ...o }, { ...DEFAULT_EYE, ...o }];
const skin = (l: number) => l > 0 && l <= 1;

describe('sample', () => {
  it('is background outside the body', () => {
    expect(sample(DEFAULT_POSE, 0.02, 0.02)).toBe(BG);
  });

  it('is lit skin on the body', () => {
    expect(skin(sample(DEFAULT_POSE, 0.55, 0.8))).toBe(true);
  });

  it('cuts an oval hole at the eye centre', () => {
    expect(sample(DEFAULT_POSE, 0.37, 0.45)).toBe(HOLE);
  });

  it('lights the glint up and to the left of the eye centre', () => {
    expect(sample(DEFAULT_POSE, 0.3364, 0.3828)).toBe(1);
  });

  it('drops the glint when glint is off', () => {
    expect(sample(pose({ glint: false }), 0.3364, 0.3828)).toBe(HOLE);
  });

  it('arc (^): the centre is skin, the upper band is a hole', () => {
    const p = pose({ shape: 'arc' });
    expect(skin(sample(p, 0.37, 0.45))).toBe(true);
    expect(sample(p, 0.37, 0.3604)).toBe(HOLE);
  });

  it('chevron (>): the inward tip is a hole, the centre is skin', () => {
    const p = pose({ shape: 'chevron' });
    expect(sample(p, 0.44875, 0.45)).toBe(HOLE);
    expect(skin(sample(p, 0.37, 0.45))).toBe(true);
  });

  it('the upper lid hides the top of the eye', () => {
    const p = pose({ eyes: bothEyes({ lid: 0.72 }) });
    expect(skin(sample(p, 0.37, 0.33))).toBe(true);
    expect(sample(p, 0.37, 0.55)).toBe(HOLE);
  });

  it('slant lowers the outer corner of the lid (worried), not the inner', () => {
    const p = pose({ eyes: bothEyes({ lid: 0.3, slant: 1.4 }) });
    expect(sample(p, 0.43, 0.4)).toBe(HOLE);
    expect(skin(sample(p, 0.31, 0.4))).toBe(true);
  });

  it('the lower lid hides the bottom of the eye', () => {
    const p = pose({ eyes: bothEyes({ low: 0.38 }) });
    expect(skin(sample(p, 0.37, 0.55))).toBe(true);
    expect(sample(p, 0.37, 0.42)).toBe(HOLE);
  });

  it('squash keeps the body anchored at the bottom of the frame', () => {
    expect(skin(sample(pose({ squash: 0.07 }), 0.58, 0.99))).toBe(true);
  });

  it('tilt rotates the face about the body centre', () => {
    const p = pose({ tilt: 0.5 });
    expect(sample(p, 0.5156, 0.3799)).toBe(HOLE);
    expect(skin(sample(p, 0.37, 0.45))).toBe(true);
  });

  it.each(['oval', 'arc', 'chevron'] as const)('stays finite with %s eyes fully closed', (shape) => {
    for (const [u, v] of [[0.37, 0.45], [0.37, 0.3604], [0.44875, 0.45]]) {
      expect(Number.isFinite(sample(pose({ shape, open: 0 }), u, v))).toBe(true);
    }
  });
});

describe('cells', () => {
  it('samples cell centres row-major, sized to the rows by default', () => {
    const c = cells(DEFAULT_POSE, 4, 3);
    expect(c.length).toBe(12);
    expect(c[1 * 4 + 2]).toBe(sample(DEFAULT_POSE, 2.5 / 3, 1.5 / 3));
  });

  it('offsets the character frame', () => {
    const c = cells(DEFAULT_POSE, 4, 3, { x0: 1, y0: 0, size: 3 });
    expect(c[2]).toBe(sample(DEFAULT_POSE, 1.5 / 3, 0.5 / 3));
  });
});

describe('gridFor', () => {
  it('landscape: 48 rows, character centred horizontally', () => {
    expect(gridFor(1920, 1080)).toEqual({ cols: 86, rows: 48, cell: 22.5, frame: { x0: 19, y0: 0, size: 48 } });
  });

  it('portrait: 48 columns, character anchored to the bottom', () => {
    expect(gridFor(390, 844)).toEqual({ cols: 48, rows: 104, cell: 8.125, frame: { x0: 0, y0: 56, size: 48 } });
  });

  it('survives a zero-size window', () => {
    const g = gridFor(0, 0);
    expect(g.cols).toBeGreaterThanOrEqual(1);
    expect(g.rows).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(g.cell)).toBe(true);
  });
});
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `npx vitest run figbot/src/model.test.ts`
Expected: FAIL, with `Failed to resolve import "./model"`.

- [ ] **Step 4: Implement `figbot/src/model.ts`**

```ts
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
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx vitest run figbot/src/model.test.ts`
Expected: PASS, all tests.

If a geometry test fails, re-derive the expected point from the constants in the header comment of the test file before changing any code. The points come from the spec's numbers.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts figbot/src/model.ts figbot/src/model.test.ts
git commit -m "feat: Figbot pose model: halftone sphere with oval, arc and chevron eyes, lids, tilt, squash; grid framing for any window"
```

---

### Task 2: Expressions and `lerp`

**Files:**
- Modify: `figbot/src/model.ts` (append)
- Test: `figbot/src/model.test.ts` (append)

**Interfaces:**
- Consumes: `Pose`, `EyePose`, `DEFAULT_POSE`, `DEFAULT_EYE`, `cells`, `HOLE` and `GRID` from Task 1.
- Produces:
  - `type ExpressionName = 'idle' | 'curious' | 'happy' | 'excited' | 'thinking' | 'sleepy' | 'worried'`
  - `EXPRESSIONS: readonly ExpressionName[]`, in sheet order. The live page maps keys 1–7 onto it.
  - `POSES: Record<ExpressionName, Pose>`
  - `lerp(a: Pose, b: Pose, k: number): Pose`. It always returns a new object. `shape` and `glint` switch at `k >= 0.5`.

- [ ] **Step 1: Write the failing tests** (append to `figbot/src/model.test.ts`)

```ts
import { EXPRESSIONS, GRID, POSES, lerp } from './model';

describe('expressions', () => {
  it('lists the seven expressions in sheet order', () => {
    expect(EXPRESSIONS).toEqual(['idle', 'curious', 'happy', 'excited', 'thinking', 'sleepy', 'worried']);
  });

  const holes = (c: Float64Array) => c.reduce((n, l) => n + (l === HOLE ? 1 : 0), 0);

  it.each(EXPRESSIONS)('%s shows its eyes', (name) => {
    expect(holes(cells(POSES[name], GRID, GRID))).toBeGreaterThanOrEqual(10);
  });

  it('every pair of expressions differs clearly', () => {
    const grids = EXPRESSIONS.map(n => cells(POSES[n], GRID, GRID));
    for (let a = 0; a < grids.length; a++) {
      for (let b = a + 1; b < grids.length; b++) {
        let diff = 0;
        for (let i = 0; i < grids[a].length; i++) if ((grids[a][i] === HOLE) !== (grids[b][i] === HOLE)) diff++;
        expect(diff, `${EXPRESSIONS[a]} vs ${EXPRESSIONS[b]}`).toBeGreaterThanOrEqual(20);
      }
    }
  });

  it('uses the eye shape each expression is defined by', () => {
    expect(POSES.happy.shape).toBe('arc');
    expect(POSES.excited.shape).toBe('chevron');
    for (const n of ['idle', 'curious', 'thinking', 'sleepy', 'worried'] as const) expect(POSES[n].shape).toBe('oval');
  });
});

describe('lerp', () => {
  it('returns a at 0 and b at 1 exactly', () => {
    expect(lerp(POSES.idle, POSES.sleepy, 0)).toEqual(POSES.idle);
    expect(lerp(POSES.idle, POSES.sleepy, 1)).toEqual(POSES.sleepy);
  });

  it('blends numbers, including per-eye fields', () => {
    const p = lerp(POSES.idle, POSES.sleepy, 0.5);
    expect(p.tilt).toBeCloseTo(0.12, 10);
    expect(p.eyes[0].lid).toBeCloseTo(0.36, 10);
  });

  it('switches shape and glint at the halfway point', () => {
    expect(lerp(POSES.idle, POSES.happy, 0.49).shape).toBe('oval');
    expect(lerp(POSES.idle, POSES.happy, 0.5).shape).toBe('arc');
    expect(lerp(POSES.idle, POSES.sleepy, 0.49).glint).toBe(true);
    expect(lerp(POSES.idle, POSES.sleepy, 0.5).glint).toBe(false);
  });

  it('never mutates its inputs', () => {
    const before = structuredClone(POSES.idle);
    lerp(POSES.idle, POSES.happy, 0.3).eyes[0].lid = 9;
    expect(POSES.idle).toEqual(before);
  });
});
```

Merge the new import names into the existing import line at the top of the file. Don't keep two imports from `./model`.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run figbot/src/model.test.ts`
Expected: FAIL, because `EXPRESSIONS`, `POSES` and `lerp` aren't exported.

- [ ] **Step 3: Implement** (append to `figbot/src/model.ts`)

```ts
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
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run figbot/src/model.test.ts`
Expected: PASS.

If the "differs clearly" test fails for a pair, **do not lower the threshold or edit the pose values**. Report the pair and its diff count. The spec values are approved art direction, so any change goes back to the user.

- [ ] **Step 5: Commit**

```bash
git add figbot/src/model.ts figbot/src/model.test.ts
git commit -m "feat: Figbot's seven expressions (idle, curious, happy, excited, thinking, sleepy, worried) and pose blending"
```

---

### Task 3: Halftone SVG

**Files:**
- Create: `figbot/src/svg.ts`
- Test: `figbot/src/svg.test.ts`

**Interfaces:**
- Consumes: the cell arrays from `cells()` (Task 1). Values are `BG = -1`, `HOLE = 0` or a lum in `(0, 1]`.
- Produces:
  - `BG_COLOR = '#0A0A0A'`, `FG_COLOR = '#F2F2F2'`
  - `dotRadius(lum: number): number`: the radius as a fraction of a cell, or 0 when no dot should be drawn. `live.ts` uses it too.
  - `svgBody(c: ArrayLike<number>, cols: number, rows: number): string`: a background rect plus a `<g>` of circles, in cell units.
  - `toSvg(c: ArrayLike<number>, cols: number, rows: number, viewWidth?: number): string`: a full `<svg>`. The viewBox is `0 0 viewWidth rows`, where `viewWidth` defaults to `cols`.

- [ ] **Step 1: Write the failing tests**

Create `figbot/src/svg.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BG, HOLE } from './model';
import { BG_COLOR, FG_COLOR, dotRadius, svgBody, toSvg } from './svg';

describe('dotRadius', () => {
  it('draws nothing for background, holes and near-black', () => {
    expect(dotRadius(BG)).toBe(0);
    expect(dotRadius(HOLE)).toBe(0);
    expect(dotRadius(0.01)).toBe(0);
  });

  it('grows with the square root of luminance up to 0.52 of a cell', () => {
    expect(dotRadius(1)).toBeCloseTo(0.52, 10);
    expect(dotRadius(0.25)).toBeCloseTo(0.26, 10);
  });
});

describe('svg', () => {
  it('draws one circle per lit cell, centred in its cell', () => {
    const body = svgBody([BG, 1, HOLE, 0.25], 2, 2);
    expect(body.match(/<circle/g)).toHaveLength(2);
    expect(body).toContain('<circle cx="1.5" cy="0.5" r="0.520"/>');
    expect(body).toContain('<circle cx="1.5" cy="1.5" r="0.260"/>');
    expect(body).toContain(`fill="${BG_COLOR}"`);
    expect(body).toContain(`fill="${FG_COLOR}"`);
  });

  it('wraps the body in an svg sized in cells', () => {
    const svg = toSvg([1], 1, 1);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 1 1" width="1" height="1">/);
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('can crop the viewBox narrower than the grid (for exact aspect ratios)', () => {
    expect(toSvg([1, 1, 1], 3, 1, 2.5)).toContain('viewBox="0 0 2.5 1" width="2.5" height="1"');
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run figbot/src/svg.test.ts`
Expected: FAIL, with `Failed to resolve import "./svg"`.

- [ ] **Step 3: Implement `figbot/src/svg.ts`**

```ts
/** Figbot cells → halftone SVG, in cell units (one cell = one user unit). */

export const BG_COLOR = '#0A0A0A';
export const FG_COLOR = '#F2F2F2';

/** Dot radius as a fraction of a cell; 0 when there is no dot (background, hole, or too small to see). */
export function dotRadius(lum: number): number {
  if (lum <= 0) return 0;
  const r = Math.sqrt(lum) * 0.52;
  return r < 0.07 ? 0 : r;
}

export function svgBody(c: ArrayLike<number>, cols: number, rows: number): string {
  const dots: string[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const r = dotRadius(c[j * cols + i]);
      if (r > 0) dots.push(`<circle cx="${i + 0.5}" cy="${j + 0.5}" r="${r.toFixed(3)}"/>`);
    }
  }
  return `<rect width="${cols}" height="${rows}" fill="${BG_COLOR}"/><g fill="${FG_COLOR}">${dots.join('')}</g>`;
}

export function toSvg(c: ArrayLike<number>, cols: number, rows: number, viewWidth = cols): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} ${rows}" width="${viewWidth}" height="${rows}">${svgBody(c, cols, rows)}</svg>`;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run figbot/src/svg.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add figbot/src/svg.ts figbot/src/svg.test.ts
git commit -m "feat: Figbot halftone SVG: one circle per lit cell, radius from √luminance"
```

---

### Task 4: Loop timeline

**Files:**
- Create: `figbot/src/timeline.ts`, `figbot/src/expect-pose.ts` (test helper)
- Test: `figbot/src/timeline.test.ts`

**Interfaces:**
- Consumes: `Pose`, `ExpressionName`, `POSES` and `lerp` from Tasks 1–2.
- Produces, used by `driver.ts` and `render.ts`:
  - `LOOP = 14`, `FPS = 30`, `TRANSITION = 0.35`
  - `KEYFRAMES: readonly { at: number; name: ExpressionName }[]`
  - `BLINKS: readonly number[]`
  - `smoothstep(k: number): number`: clamps `k` to `[0, 1]`.
  - `transition(a: Pose, b: Pose, k: number): Pose`: a smoothstep `lerp` that dips `open` to 0.06 at `k = 0.5` when the shape changes.
  - `interface Stage { pose: Pose; thinking: number }`: the pose before breathing and drift; `thinking` is the drift weight, 0..1.
  - `stageAt(t: number): Stage`: wraps any `t` into the loop and includes blinks.
  - `live(s: Stage, t: number): Pose`: adds the breath (`bob`) and the Thinking drift (`gx`) at clock time `t`.
  - `poseAt(t: number): Pose`, which equals `live(stageAt(t), wrap(t))`.

- [ ] **Step 1: Write the failing tests**

Create `figbot/src/expect-pose.ts`, a shared test helper. It isn't matched by the `*.test.ts` include, so vitest only loads it when a test imports it:

```ts
import { expect } from 'vitest';
import type { Pose } from './model';

/** Poses match: same shape and glint, every number equal to 6 decimals. */
export function expectPoseClose(a: Pose, b: Pose) {
  expect(a.shape).toBe(b.shape);
  expect(a.glint).toBe(b.glint);
  for (const k of ['open', 'gx', 'gy', 'tilt', 'squash', 'bob', 'exposure'] as const) expect(a[k], k).toBeCloseTo(b[k], 6);
  for (const e of [0, 1] as const) {
    for (const k of ['scale', 'sx', 'lid', 'low', 'slant'] as const) expect(a.eyes[e][k], `eyes[${e}].${k}`).toBeCloseTo(b.eyes[e][k], 6);
  }
}
```

Create `figbot/src/timeline.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { expectPoseClose } from './expect-pose';
import { POSES } from './model';
import { BLINKS, KEYFRAMES, LOOP, TRANSITION, live, poseAt } from './timeline';

describe('poseAt', () => {
  it('loops seamlessly: the end meets the start', () => {
    expectPoseClose(poseAt(LOOP - 1e-9), poseAt(0));
  });

  it('wraps negative and far-future times into the loop', () => {
    expect(poseAt(-1)).toEqual(poseAt(13));
    expectPoseClose(poseAt(LOOP * 100 + 3), poseAt(3));
  });

  it.each(KEYFRAMES.map(k => [k.name, k.at] as const))('holds %s (from %ss) once its transition is done', (name, at) => {
    const t = at + 0.45;
    expect(poseAt(t)).toEqual(live({ pose: POSES[name], thinking: name === 'thinking' ? 1 : 0 }, t));
  });

  it('hides every shape change behind a blink', () => {
    let changes = 0;
    KEYFRAMES.forEach((k, i) => {
      const prev = KEYFRAMES[(i - 1 + KEYFRAMES.length) % KEYFRAMES.length];
      if (POSES[prev.name].shape === POSES[k.name].shape) return;
      changes++;
      expect(poseAt(k.at + TRANSITION / 2).open, `${prev.name} → ${k.name}`).toBeLessThanOrEqual(0.1);
    });
    expect(changes).toBe(3); // thinking→happy, happy→excited, excited→worried
  });

  it('blinks at each blink time', () => {
    for (const b of BLINKS) expect(poseAt(b).open).toBeLessThanOrEqual(0.1);
  });

  it('breathes', () => {
    const bobs = [0.5, 1.6, 2.7].map(t => poseAt(t).bob);
    expect(new Set(bobs.map(b => b.toFixed(5))).size).toBe(3);
    for (const b of bobs) expect(Math.abs(b)).toBeLessThanOrEqual(0.006 + 1e-12);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run figbot/src/timeline.test.ts`
Expected: FAIL, with `Failed to resolve import "./timeline"`.

- [ ] **Step 3: Implement `figbot/src/timeline.ts`**

```ts
import { POSES, lerp, type ExpressionName, type Pose } from './model';

export const LOOP = 14;
export const FPS = 30;
export const TRANSITION = 0.35;

const BLINK = 0.09;   // half-width of a blink, s
const BREATH = 0.006;
const DRIFT = 0.012;
// whole cycles per loop keep it seamless: 3 breaths, 2 drifts
const W_BREATH = (2 * Math.PI * 3) / LOOP;
const W_DRIFT = (2 * Math.PI * 2) / LOOP;

export const KEYFRAMES: readonly { at: number; name: ExpressionName }[] = [
  { at: 0, name: 'idle' },
  { at: 2.0, name: 'curious' },
  { at: 3.8, name: 'thinking' },
  { at: 5.8, name: 'happy' },
  { at: 7.2, name: 'excited' },
  { at: 8.6, name: 'worried' },
  { at: 10.2, name: 'sleepy' },
  { at: 12.4, name: 'idle' },
];

/** An idle blink, and the wake-up blink after Sleepy. */
export const BLINKS: readonly number[] = [1.2, 13.0];

export const smoothstep = (k: number) => {
  const x = Math.min(1, Math.max(0, k));
  return x * x * (3 - 2 * x);
};

// exact for t already in [0, LOOP), unlike ((t % LOOP) + LOOP) % LOOP
const wrap = (t: number) => t - LOOP * Math.floor(t / LOOP);

/** Blend a → b at raw progress k (0..1); a change of eye shape is hidden behind a blink. */
export function transition(a: Pose, b: Pose, k: number): Pose {
  const p = lerp(a, b, smoothstep(k));
  if (a.shape !== b.shape) p.open *= 1 - 0.94 * (1 - Math.abs(2 * Math.min(1, Math.max(0, k)) - 1));
  return p;
}

/** A pose before breathing and drift; `thinking` weights the Thinking drift (0..1). */
export interface Stage { pose: Pose; thinking: number }

const blinkAt = (t: number) => {
  let m = 1;
  for (const b of BLINKS) {
    const d = Math.abs(t - b);
    if (d < BLINK) m = Math.min(m, Math.max(0.06, d / BLINK));
  }
  return m;
};

export function stageAt(t: number): Stage {
  const tt = wrap(t);
  let i = KEYFRAMES.length - 1;
  while (KEYFRAMES[i].at > tt) i--;
  const cur = KEYFRAMES[i];
  const prev = KEYFRAMES[(i - 1 + KEYFRAMES.length) % KEYFRAMES.length];
  const k = (tt - cur.at) / TRANSITION;
  const s = smoothstep(k);
  const pose = k < 1 ? transition(POSES[prev.name], POSES[cur.name], k) : { ...POSES[cur.name] };
  pose.open *= blinkAt(tt);
  return { pose, thinking: (cur.name === 'thinking' ? s : 0) + (prev.name === 'thinking' ? 1 - s : 0) };
}

/** Layer the idle breath and the Thinking drift onto a stage, at clock time t. */
export function live(s: Stage, t: number): Pose {
  return {
    ...s.pose,
    bob: s.pose.bob + BREATH * Math.sin(W_BREATH * t),
    gx: s.pose.gx + s.thinking * DRIFT * Math.sin(W_DRIFT * t),
  };
}

export function poseAt(t: number): Pose {
  return live(stageAt(t), wrap(t));
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run figbot/src/timeline.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add figbot/src/timeline.ts figbot/src/timeline.test.ts figbot/src/expect-pose.ts
git commit -m "feat: Figbot's 14 s loop: expression holds, blinks, breath and thinking drift; shape changes hidden behind a blink"
```

---

### Task 5: Live-page driver (loop, held expressions, resume)

**Files:**
- Create: `figbot/src/driver.ts`
- Test: `figbot/src/driver.test.ts`

**Interfaces:**
- Consumes:
  - `EXPRESSIONS` and `POSES` from Task 2
  - `stageAt`, `live`, `transition`, `smoothstep`, `TRANSITION` and `Stage` from Task 4
  - `expectPoseClose(a, b)` from `figbot/src/expect-pose.ts` (Task 4)
- Produces:
  - `interface Driver { pose(now: number): Pose; press(key: string, now: number): void }`
  - `createDriver(): Driver`. `now` is wall-clock seconds.
  - Keys `'1'`–`'7'` hold `EXPRESSIONS[n - 1]`. `'0'` resumes the loop from where it paused. Every other key is ignored.
  - Every change blends from the stage currently on screen over `TRANSITION`.

- [ ] **Step 1: Write the failing tests**

Create `figbot/src/driver.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { POSES } from './model';
import { createDriver } from './driver';
import { live, poseAt, stageAt } from './timeline';
import { expectPoseClose } from './expect-pose';

describe('driver', () => {
  it('plays the loop until a key is pressed', () => {
    const d = createDriver();
    for (const t of [0, 3.3, 9.1, 20]) expectPoseClose(d.pose(t), poseAt(t));
  });

  it('holds the expression for the pressed number key', () => {
    const d = createDriver();
    d.press('4', 1);
    const p = d.pose(3);
    expect(p.shape).toBe('chevron');
    expectPoseClose(p, live({ pose: POSES.excited, thinking: 0 }, 3));
  });

  it('never jumps when a key is pressed', () => {
    const d = createDriver();
    const before = d.pose(5);
    d.press('3', 5);
    expectPoseClose(d.pose(5), before);
  });

  it('never jumps on a key pressed mid-transition', () => {
    const d = createDriver();
    d.press('3', 5);
    const before = d.pose(5.1);
    d.press('6', 5.1);
    expectPoseClose(d.pose(5.1), before);
  });

  it('resumes the loop from where it paused, blending in without a jump', () => {
    const d = createDriver();
    d.press('2', 4);
    const before = d.pose(8);
    d.press('0', 8);
    expectPoseClose(d.pose(8), before);
    expectPoseClose(d.pose(9), live(stageAt(5), 9));
  });

  it('ignores every other key, and 0 while the loop is already playing', () => {
    const d = createDriver();
    for (const k of ['0', '8', '9', 'a', ' ', 'Enter', '10']) d.press(k, 2);
    expectPoseClose(d.pose(6), poseAt(6));
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run figbot/src/driver.test.ts`
Expected: FAIL, with `Failed to resolve import "./driver"`.

- [ ] **Step 3: Implement `figbot/src/driver.ts`**

```ts
import { EXPRESSIONS, POSES, type ExpressionName, type Pose } from './model';
import { TRANSITION, live, smoothstep, stageAt, transition, type Stage } from './timeline';

export interface Driver {
  pose(now: number): Pose;
  press(key: string, now: number): void;
}

/** Live-page state: plays the loop; keys 1–7 hold an expression, 0 resumes. Every change blends from what is on screen. */
export function createDriver(): Driver {
  let held: ExpressionName | null = null;
  let loopT = 0;               // loop time at `mark`
  let mark = 0;                // wall time of the last change
  let from: Stage | null = null;

  const target = (now: number): Stage =>
    held ? { pose: POSES[held], thinking: held === 'thinking' ? 1 : 0 } : stageAt(loopT + now - mark);

  const stage = (now: number): Stage => {
    const to = target(now);
    const k = (now - mark) / TRANSITION;
    if (!from || k >= 1) return to;
    const s = smoothstep(k);
    return { pose: transition(from.pose, to.pose, k), thinking: from.thinking + (to.thinking - from.thinking) * s };
  };

  return {
    pose: (now) => live(stage(now), now),
    press(key, now) {
      if (!/^\d$/.test(key)) return;
      const n = Number(key);
      if (n > EXPRESSIONS.length || (n === 0 && held === null)) return;
      const current = stage(now);
      if (held === null) loopT += now - mark;   // freeze the loop where it is
      held = n === 0 ? null : EXPRESSIONS[n - 1];
      from = current;
      mark = now;
    },
  };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run figbot/src/driver.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add figbot/src/driver.ts figbot/src/driver.test.ts
git commit -m "feat: Figbot live driver: keys 1–7 hold an expression, 0 resumes the loop, every change blends from the current pose"
```

---

### Task 6: Stills (hero, expressions, sheet)

**Files:**
- Create: `figbot/render.ts`
- Create (generated): `figbot/out/hero-square.svg`, `figbot/out/hero-square.png`, `figbot/out/hero-wide.png`, `figbot/out/expressions/*.png`, `figbot/out/sheet.png`

**Interfaces:**
- Consumes:
  - `cells`, `GRID`, `POSES` and `EXPRESSIONS` from Tasks 1–2
  - `toSvg`, `svgBody`, `BG_COLOR` and `FG_COLOR` from Task 3
- Produces: `npx tsx figbot/render.ts`. Tasks 7 and 8 append sections to this file.

- [ ] **Step 1: Write `figbot/render.ts`**

```ts
/** Renders every Figbot teaser output into figbot/out/. Run: npx tsx figbot/render.ts */
import { mkdirSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { EXPRESSIONS, GRID, POSES, cells, type Pose } from './src/model';
import { BG_COLOR, FG_COLOR, svgBody, toSvg } from './src/svg';

const OUT = 'figbot/out';
const FONT = 'scripts/assets/DepartureMono-Regular.otf';

const png = (svg: string, width: number) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: 'Departure Mono' } })
    .render()
    .asPng();
const square = (p: Pose) => toSvg(cells(p, GRID, GRID), GRID, GRID);

mkdirSync(`${OUT}/expressions`, { recursive: true });

// hero: Idle, square and 16:9 (sphere bottom-left, black space to the right)
const hero = square(POSES.idle);
writeFileSync(`${OUT}/hero-square.svg`, hero);
writeFileSync(`${OUT}/hero-square.png`, png(hero, 2048));
const WIDE = (GRID * 16) / 9; // 85.33 cells: crop the last column so the PNG is exactly 2560×1440
writeFileSync(`${OUT}/hero-wide.png`, png(toSvg(cells(POSES.idle, Math.ceil(WIDE), GRID, { x0: 4, y0: 0, size: GRID }), Math.ceil(WIDE), GRID, WIDE), 2560));

// expressions: one PNG each, plus a labelled 4 + 3 sheet
const TILE = 560, GAP = 40, MARGIN = 80, LABEL = 70, PER_ROW = 4;
const tiles = EXPRESSIONS.map((name, n) => {
  const c = cells(POSES[name], GRID, GRID);
  writeFileSync(`${OUT}/expressions/${name}.png`, png(toSvg(c, GRID, GRID), 1024));
  const x = MARGIN + (n % PER_ROW) * (TILE + GAP);
  const y = MARGIN + Math.floor(n / PER_ROW) * (TILE + LABEL + GAP);
  const label = name[0].toUpperCase() + name.slice(1);
  return `<svg x="${x}" y="${y}" width="${TILE}" height="${TILE}" viewBox="0 0 ${GRID} ${GRID}">${svgBody(c, GRID, GRID)}</svg>`
    + `<text x="${x}" y="${y + TILE + 44}" font-family="Departure Mono" font-size="28" fill="${FG_COLOR}" fill-opacity="0.4">${label}</text>`;
});
const rows = Math.ceil(EXPRESSIONS.length / PER_ROW);
const W = MARGIN * 2 + PER_ROW * TILE + (PER_ROW - 1) * GAP;
const H = MARGIN * 2 + rows * (TILE + LABEL) + (rows - 1) * GAP;
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${BG_COLOR}"/>${tiles.join('')}</svg>`;
writeFileSync(`${OUT}/sheet.png`, png(sheet, W));

console.log('stills written');
```

- [ ] **Step 2: Run it**

Run: `npx tsx figbot/render.ts`
Expected: prints `stills written`.

- [ ] **Step 3: Verify the sizes**

Run:

```bash
for f in figbot/out/hero-square.png figbot/out/hero-wide.png figbot/out/expressions/idle.png figbot/out/sheet.png; do ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$f" | sed "s|^|$f |"; done; ls figbot/out/expressions
```

Expected:
- `hero-square.png`: `2048,2048`
- `hero-wide.png`: `2560,1440`
- `idle.png`: `1024,1024`
- `sheet.png`: `2520,1460`
- `figbot/out/expressions/` contains 7 PNGs: curious, excited, happy, idle, sleepy, thinking, worried.

- [ ] **Step 4: Look at them**

Open each image with the Read tool and confirm:
- the halftone sphere peeks in from the bottom,
- the eyes are big holes with a glint (no glint on Thinking or Sleepy),
- happy shows ^ ^ and excited shows > <,
- the sheet labels are readable and grey,
- `hero-wide` has empty black space on the right.

If anything looks wrong, stop and report it with the image rather than tuning numbers.

- [ ] **Step 5: Commit**

```bash
git add figbot/render.ts figbot/out
git commit -m "feat: Figbot stills: square and wide hero, one PNG per expression, labelled expression sheet"
```

---

### Task 7: Loop video (MP4 + GIF)

**Files:**
- Modify: `figbot/render.ts`
- Create (generated): `figbot/out/loop.mp4`, `figbot/out/loop.gif`

**Interfaces:**
- Consumes: `poseAt`, `LOOP` and `FPS` from Task 4; `png` and `square` from inside `render.ts`.
- Produces: the two video files.

- [ ] **Step 1: Add the imports** at the top of `figbot/render.ts`

Merge these with the existing imports:

```ts
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { FPS, LOOP, poseAt } from './src/timeline';
```

- [ ] **Step 2: Insert the loop section** directly before `console.log('stills written');`

Then change that log line to `console.log('figbot/out written');`.

```ts
// loop: 420 deterministic frames → MP4 (1080², 30 fps) and GIF (540², 15 fps)
const frames = mkdtempSync(join(tmpdir(), 'figbot-'));
try {
  for (let f = 0; f < LOOP * FPS; f++) {
    writeFileSync(join(frames, `f${String(f).padStart(4, '0')}.png`), png(square(poseAt(f / FPS)), 1080));
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', `${OUT}/loop.mp4`]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${OUT}/loop.mp4`,
    '-vf', 'fps=15,scale=540:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse', '-loop', '0', `${OUT}/loop.gif`]);
} finally {
  rmSync(frames, { recursive: true, force: true });
}
```

- [ ] **Step 3: Run it**

Run: `npx tsx figbot/render.ts`
Expected: prints `figbot/out written`. It takes about a minute.

- [ ] **Step 4: Verify the frame count, size and duration**

Run:

```bash
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=width,height,nb_read_frames,r_frame_rate -of csv=p=0 figbot/out/loop.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 figbot/out/loop.gif
ls -lh figbot/out/loop.*
```

Expected:
- the MP4 line contains `1080,1080,30/1,420`,
- the GIF is `540,540`,
- both files are a few MB at most.

- [ ] **Step 5: Check the seam and a few frames by eye**

Run:

```bash
mkdir -p /tmp/figbot-check && for s in 0 1.2 5.975 7.5 11 13.99; do ffmpeg -v error -y -ss $s -i figbot/out/loop.mp4 -frames:v 1 /tmp/figbot-check/t$s.png; done
```

Read the PNGs and confirm:
- `t0` and `t13.99` look the same (idle),
- `t1.2` is mid-blink,
- `t5.975` is mid-blink (the shape swap),
- `t7.5` shows > <,
- `t11` is sleepy.

- [ ] **Step 6: Commit**

```bash
git add figbot/render.ts figbot/out/loop.mp4 figbot/out/loop.gif
git commit -m "feat: Figbot 14 s seamless loop as MP4 (1080², 30 fps) and GIF (540², 15 fps)"
```

---

### Task 8: Live page

**Files:**
- Create: `figbot/src/live.ts`
- Modify: `figbot/render.ts`
- Create (generated): `figbot/out/live.html`

**Interfaces:**
- Consumes:
  - `cells`, `gridFor` and `POSES` from Tasks 1–2
  - `dotRadius`, `BG_COLOR` and `FG_COLOR` from Task 3
  - `createDriver` from Task 5
- Produces: `figbot/out/live.html`, a single self-contained file.

- [ ] **Step 1: Write `figbot/src/live.ts`**

```ts
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
  const w = innerWidth, h = innerHeight, dpr = devicePixelRatio || 1;
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
```

- [ ] **Step 2: Add the live-page build to `figbot/render.ts`**

Add `import { build } from 'esbuild';` to the imports. Then insert this directly before the final `console.log`:

```ts
// live page: one self-contained HTML file
const js = await build({ entryPoints: ['figbot/src/live.ts'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020' });
writeFileSync(`${OUT}/live.html`, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>figbot</title>
<style>html,body{margin:0;height:100%;background:${BG_COLOR};overflow:hidden}canvas{display:block;width:100vw;height:100vh}</style>
</head>
<body>
<canvas aria-label="Figbot, a halftone mascot. Press 1 to 7 to change its expression, 0 to resume." role="img"></canvas>
<script>${js.outputFiles[0].text}</script>
</body>
</html>
`);
```

- [ ] **Step 3: Run it, then typecheck and run every test**

Run:

```bash
npx tsx figbot/render.ts && npm run typecheck && npm test
```

Expected:
- prints `figbot/out written`,
- typecheck reports 0 errors,
- every test passes, both the site's and figbot's.

- [ ] **Step 4: Check the live page in a browser**

Open `figbot/out/live.html` in Chrome using the chrome-devtools MCP: `new_page` with a `file://` URL to the absolute path. Then:
1. Take a screenshot. The character is animating on black.
2. Press `5`, wait about 1 s and take a screenshot. It shows Thinking (looking up with lower lids).
3. Press `3`, then immediately `4`, and screenshot. There's no glitch, and it settles on Excited (> <).
4. Press `0` and screenshot. The loop resumes.
5. Resize to 390×844 and screenshot. The character sits at the bottom, centred, and isn't stretched.
6. Emulate `prefers-reduced-motion: reduce` and reload. It shows a still Idle.
7. List the console messages. There should be no errors.

- [ ] **Step 5: Commit**

```bash
git add figbot/src/live.ts figbot/render.ts figbot/out/live.html
git commit -m "feat: Figbot live page: real-time canvas loop, keys 1–7 for expressions, 0 to resume, still under reduced motion"
```

---

### Task 9: Final regeneration and check

**Files:**
- Regenerate: `figbot/out/**`

- [ ] **Step 1: Regenerate everything from a clean output folder**

```bash
rm -rf figbot/out && npx tsx figbot/render.ts && git status --short figbot/out
```

Expected:
- `git status` shows **no changes**, which proves the outputs are reproducible,
- or, at most, `loop.mp4`/`loop.gif` differ in container metadata only.

If a PNG differs, find out why before committing. Rendering is meant to be deterministic.

- [ ] **Step 2: Confirm nothing outside the scope changed**

```bash
git diff --stat origin/master -- . ':!figbot' ':!docs/superpowers'
```

Expected: only `vitest.config.ts` (1 line).

- [ ] **Step 3: Commit if anything was regenerated**

```bash
git add figbot/out && git diff --cached --quiet || git commit -m "chore: regenerate Figbot outputs"
```
