/** A section in page coordinates. */
export interface Span {
  top: number;
  bottom: number;
  /** centre it in the space under the nav when it fits there, rather than lining its top up under the nav */
  center?: boolean;
}

export interface Layout {
  /** the sections to stop at, in order; the last should run to the end of the page */
  sections: Span[];
  /** viewport height */
  vh: number;
  /** height of the fixed nav covering the top of the viewport */
  nav: number;
  /** the furthest the page can scroll */
  max: number;
}

/**
 * Pixels of slack when deciding whether the page is at a stop: covers sub-pixel scrolling, and nav links,
 * which land 16px short of a stop because [id] has a 96px scroll-margin-top against the 80px nav.
 */
const SLACK = 24;

const clamp = (y: number, max: number) => Math.min(Math.max(0, y), max);

/** Scroll position of each stop: its section's top just under the nav, or centred under it when marked and it fits. */
export function stopPositions({ sections, vh, nav, max }: Layout): number[] {
  return sections.map((s, i) => {
    if (i === 0) return 0;
    const spare = vh - nav - (s.bottom - s.top);
    return clamp(s.top - nav - (s.center && spare > 0 ? spare / 2 : 0), max);
  });
}

/** The stop the page is at or past. */
export function currentIndex(positions: number[], y: number): number {
  let i = 0;
  positions.forEach((p, j) => { if (p <= y + SLACK) i = j; });
  return i;
}

/**
 * Where one gesture in `dir` should scroll to from `y`, or null at either end.
 * A section taller than the space under the nav is stepped through a screen at a time before moving on.
 */
export function nextTarget(layout: Layout, y: number, dir: 1 | -1): number | null {
  const { sections, vh, nav, max } = layout;
  const pos = stopPositions(layout);
  const i = currentIndex(pos, y);
  const page = vh - nav;

  if (dir === 1) {
    const end = clamp(sections[i].bottom - vh, max);
    if (end > y + SLACK) return Math.min(y + page, end);
    return i + 1 < pos.length ? pos[i + 1] : null;
  }
  if (y > pos[i] + SLACK) return Math.max(pos[i], y - page);
  if (i === 0) return null;
  // land on a tall previous section's bottom, so going up steps back through it
  return Math.max(pos[i - 1], clamp(sections[i - 1].bottom - vh, max));
}

/**
 * Turns a stream of wheel events into single steps: one per gesture, however long the trackpad's momentum runs.
 * After a step it stays spent until the wheel has been quiet for `quietMs` and no scroll is animating.
 */
export class WheelGate {
  private acc = 0;
  private last = -Infinity;
  private spent = false;
  private animating = false;

  constructor(private threshold = 30, private quietMs = 150) {}

  setAnimating(on: boolean): void {
    this.animating = on;
  }

  /** The step this event completes: 1 down, -1 up, 0 none. `now` in milliseconds. */
  wheel(deltaY: number, now: number): -1 | 0 | 1 {
    const gap = now - this.last;
    this.last = now;
    if (this.spent) {
      if (this.animating || gap < this.quietMs) return 0;
      this.spent = false;
    }
    if (gap >= this.quietMs) this.acc = 0;
    this.acc += deltaY;
    if (Math.abs(this.acc) < this.threshold) return 0;
    const dir = this.acc > 0 ? 1 : -1;
    this.acc = 0;
    this.spent = true;
    return dir;
  }
}
