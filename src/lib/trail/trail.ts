/** Grid cell size in CSS px. */
export const CELL = 10;
/** How long a dot takes to fade out, in ms. */
export const FADE_MS = 500;

interface Dot { i: number; j: number; lit: number }

/** The cursor trail's dots: the grid cells the pointer has passed over, each fading out after it was lit. */
export class Trail {
  private dots = new Map<string, Dot>();

  get size(): number {
    return this.dots.size;
  }

  /** Lights the cell under the point (x, y), in viewport px, at time `now` in ms. */
  add(x: number, y: number, now: number): void {
    const i = Math.floor(x / CELL), j = Math.floor(y / CELL);
    this.dots.set(`${i},${j}`, { i, j, lit: now });
  }

  /** The dots still showing at `now`, with their opacity; faded ones are dropped. */
  live(now: number): { i: number; j: number; alpha: number }[] {
    const out = [];
    for (const [key, d] of this.dots) {
      const alpha = 1 - (now - d.lit) / FADE_MS;
      if (alpha <= 0) this.dots.delete(key);
      else out.push({ i: d.i, j: d.j, alpha });
    }
    return out;
  }
}
