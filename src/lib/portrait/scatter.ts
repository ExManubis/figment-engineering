/** Dots within this many CSS px of the pointer are pushed away. */
export const RADIUS = 40;
/** Push at the pointer itself, in px/s², fading linearly to 0 at RADIUS. */
const PUSH = 2000;
/** Spring pulling each dot home, and the damping that keeps it from ringing for long (slightly under critical). */
const STIFFNESS = 90;
const DAMPING = 13;
/** Physics substep, so a slow frame can't make the spring overshoot and blow up. */
const MAX_STEP = 1 / 120;
/** A dot this close to home and this slow is snapped home. */
const REST_PX = 0.1;
const REST_SPEED = 1;

/**
 * The portrait's dots as springs: the pointer pushes nearby dots away from it and each springs back home.
 * `dx`/`dy` are each cell's offset from home in CSS px; only the cells listed in `lit` ever move.
 */
export class Scatter {
  readonly dx: Float32Array;
  readonly dy: Float32Array;
  private readonly vx: Float32Array;
  private readonly vy: Float32Array;
  settled = true;

  constructor(
    private readonly cols: number,
    rows: number,
    private readonly cell: number,
    private readonly lit: readonly number[],
  ) {
    const n = cols * rows;
    this.dx = new Float32Array(n);
    this.dy = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
  }

  /** Advances `dt` seconds with the pointer at `pointer` (canvas CSS px) or gone. Returns whether any dot is off home. */
  step(pointer: { x: number; y: number } | null, dt: number): boolean {
    if (this.settled && !pointer) return false;
    const steps = Math.max(1, Math.ceil(dt / MAX_STEP));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      for (const k of this.lit) {
        let ax = -STIFFNESS * this.dx[k] - DAMPING * this.vx[k];
        let ay = -STIFFNESS * this.dy[k] - DAMPING * this.vy[k];
        if (pointer) {
          const px = ((k % this.cols) + 0.5) * this.cell + this.dx[k] - pointer.x;
          const py = (Math.floor(k / this.cols) + 0.5) * this.cell + this.dy[k] - pointer.y;
          const d = Math.hypot(px, py);
          if (d < RADIUS && d > 1e-3) {
            const f = (PUSH * (1 - d / RADIUS)) / d;
            ax += px * f;
            ay += py * f;
          }
        }
        this.vx[k] += ax * h;
        this.vy[k] += ay * h;
        this.dx[k] += this.vx[k] * h;
        this.dy[k] += this.vy[k] * h;
      }
    }
    let moving = false;
    for (const k of this.lit) {
      if (Math.hypot(this.dx[k], this.dy[k]) < REST_PX && Math.hypot(this.vx[k], this.vy[k]) < REST_SPEED) {
        this.dx[k] = this.dy[k] = this.vx[k] = this.vy[k] = 0;
      } else {
        moving = true;
      }
    }
    this.settled = !moving && !pointer;
    return moving;
  }
}
