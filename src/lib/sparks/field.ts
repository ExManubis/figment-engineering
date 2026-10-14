import type { Rng } from '../decode/rng';
import type { DotCell } from '../dotgrid/paint';
import type { BeanData } from './parse';

export type SparkMode = 'idle' | 'working' | 'gathering';

interface Spark {
  x: number; y: number; vx: number; vy: number;
  hx: number; hy: number;
  angle: number; radius: number; speed: number; wobble: number; phase: number; delay: number;
  color: string;
}

const DT = 1 / 24;
const TRAIL = 0.62;

export class SparkField {
  mode: SparkMode = 'idle';
  private sparks: Spark[] = [];
  private glow: Float32Array;
  private glowColor: string[];
  private t = 0;
  private energy = 0;
  private readonly cx: number;
  private readonly cy: number;

  constructor(private readonly bean: BeanData, private readonly rng: Rng) {
    this.glow = new Float32Array(bean.cols * bean.rows);
    this.glowColor = new Array<string>(bean.cols * bean.rows).fill('');
    this.cx = bean.cols / 2;
    this.cy = bean.rows / 2;
  }

  reset(): void {
    this.mode = 'idle';
    this.sparks = [];
    this.glow.fill(0);
    this.energy = 0;
  }

  /** Each dot lifts off as a spark after a short random delay, onto its own orbit lane. */
  dissolve(): void {
    const maxR = Math.min(this.cx, this.cy);
    this.sparks = this.bean.dots.map((d) => {
      const px = d.x + 0.5, py = d.y + 0.5;
      let speed = 0.6 + 0.8 * this.rng();
      if (this.rng() < 0.2) speed = -speed * 0.6; // a few counter-rotating sparks
      return {
        x: px, y: py, vx: 0, vy: 0, hx: px, hy: py,
        angle: Math.atan2(py - this.cy, px - this.cx),
        radius: maxR * (0.25 + 0.7 * this.rng()),
        speed,
        wobble: 0.08 + 0.12 * this.rng(),
        phase: this.rng() * Math.PI * 2,
        delay: 0.45 * this.rng(),
        color: d.color,
      };
    });
    this.glow.fill(0);
    this.energy = 0;
    this.mode = 'working';
    this.plot();
  }

  /** Send each spark home; sparks and homes are matched by angle so the swirl winds down instead of crossing. */
  gather(): void {
    if (!this.sparks.length) { this.mode = 'idle'; return; }
    const ang = (x: number, y: number) => Math.atan2(y - this.cy, x - this.cx);
    const homes = this.bean.dots.map((d) => ({ x: d.x + 0.5, y: d.y + 0.5, color: d.color })).sort((a, b) => ang(a.x, a.y) - ang(b.x, b.y));
    this.sparks.sort((a, b) => ang(a.x, a.y) - ang(b.x, b.y));
    this.sparks.forEach((s, k) => {
      const h = homes[Math.floor((k * homes.length) / this.sparks.length)];
      s.hx = h.x; s.hy = h.y; s.color = h.color;
    });
    this.mode = 'gathering';
  }

  step(): void {
    if (this.mode === 'idle') return;
    this.t += DT;
    this.energy += (1 - this.energy) * 0.08;
    let settled = true;
    for (const s of this.sparks) {
      if (this.mode === 'working') {
        if (s.delay > 0) { s.delay -= DT; continue; }
        s.angle += s.speed * this.energy * DT * 2.2;
        const r = s.radius * (1 + s.wobble * Math.sin(this.t * 2.3 * s.speed + s.phase));
        const tx = this.cx + r * Math.cos(s.angle), ty = this.cy + r * Math.sin(s.angle);
        s.vx = (tx - s.x) * 0.18;
        s.vy = (ty - s.y) * 0.18;
      } else {
        // damped spring home, with a little overshoot
        s.vx = s.vx * 0.78 + (s.hx - s.x) * 0.09;
        s.vy = s.vy * 0.78 + (s.hy - s.y) * 0.09;
        if (Math.abs(s.hx - s.x) > 0.35 || Math.abs(s.hy - s.y) > 0.35 || Math.abs(s.vx) + Math.abs(s.vy) > 0.1) settled = false;
      }
      s.x += s.vx;
      s.y += s.vy;
    }
    if (this.mode === 'gathering' && settled) {
      this.reset();
      return;
    }
    for (let i = 0; i < this.glow.length; i++) this.glow[i] *= TRAIL;
    this.plot();
  }

  /** Largest distance of any spark from its home (for tests and debugging). */
  maxDistanceFromHome(): number {
    return this.sparks.reduce((m, s) => Math.max(m, Math.hypot(s.x - s.hx, s.y - s.hy)), 0);
  }

  cells(bob = 0): (DotCell | undefined)[] {
    const { cols, rows } = this.bean;
    const out = new Array<DotCell | undefined>(cols * rows);
    if (this.mode === 'idle') {
      for (const d of this.bean.dots) {
        const y = d.y + bob;
        if (y >= 0 && y < rows) out[y * cols + d.x] = { cov: 1, lum: 1, color: d.color };
      }
      return out;
    }
    for (let i = 0; i < this.glow.length; i++) {
      if (this.glow[i] > 0.04) out[i] = { cov: 1, lum: 1, color: this.glowColor[i], alpha: this.glow[i] };
    }
    return out;
  }

  private plot(): void {
    const { cols, rows } = this.bean;
    for (const s of this.sparks) {
      const x = Math.floor(s.x), y = Math.floor(s.y);
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        this.glow[y * cols + x] = 1;
        this.glowColor[y * cols + x] = s.color;
      }
    }
  }
}
