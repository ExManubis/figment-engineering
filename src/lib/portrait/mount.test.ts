import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  register: vi.fn(),
  prefersReducedMotion: vi.fn(),
  setupCanvas: vi.fn(),
  paintCells: vi.fn(),
  reportError: vi.fn(),
}));
vi.mock('../motion/scheduler', () => ({ register: m.register, prefersReducedMotion: m.prefersReducedMotion }));
vi.mock('../dotgrid/paint', async (orig) => ({
  ...(await orig<typeof import('../dotgrid/paint')>()),
  setupCanvas: m.setupCanvas,
  paintCells: m.paintCells,
}));
vi.mock('../report', () => ({ reportError: m.reportError }));

import portrait from '../../data/portrait.json';
import { mountPortrait, mountWhoami } from './mount';
import { TYPE_DELAY_S, TYPE_S } from '../type/typed';

const lit = (portrait.cells as number[]).filter((v) => v > 0).length;

type Listener = (e: { clientX: number; clientY: number }) => void;

function fakeCanvas(rect: { top: number; bottom: number }, frame = { getBoundingClientRect: () => rect }) {
  const listeners: Record<string, Listener> = {};
  const canvas = {
    hidden: false,
    closest: () => frame,
    // on screen at its natural size, 256 × 320 css px from the page's top left
    getBoundingClientRect: () => ({ left: 0, top: 0, width: portrait.cols * 4 }),
    addEventListener: (type: string, fn: Listener) => { listeners[type] = fn; },
  };
  const fire = (type: string, x = 0, y = 0) => listeners[type]?.({ clientX: x, clientY: y });
  return Object.assign(canvas as unknown as HTMLCanvasElement & { hidden: boolean }, { fire, listeners });
}

/** the canvas position of a lit cell, to aim the pointer at */
function litCellCentre() {
  const k = (portrait.cells as number[]).findIndex((v, i) => v > 0.5 && i % portrait.cols > 20);
  return { k, x: ((k % portrait.cols) + 0.5) * 4, y: (Math.floor(k / portrait.cols) + 0.5) * 4 };
}

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  m.prefersReducedMotion.mockReturnValue(false);
  m.setupCanvas.mockReturnValue({});
  vi.stubGlobal('window', { innerHeight: 800 });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('mountPortrait', () => {
  it('on a frame failure reports once, hides the canvas and stops exactly once', () => {
    const stop = vi.fn();
    m.register.mockReturnValue({ stop });
    const canvas = fakeCanvas({ top: 100, bottom: 500 });
    mountPortrait(canvas); // initial draw(0) succeeds
    m.paintCells.mockImplementation(() => { throw new Error('boom'); });
    const anim = m.register.mock.calls[0][0] as { frame: (now: number) => void };
    expect(() => { anim.frame(1); anim.frame(2); anim.frame(3); }).not.toThrow();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(canvas.hidden).toBe(true);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('on a setup failure reports, hides the canvas and never registers', () => {
    m.setupCanvas.mockImplementation(() => { throw new Error('no ctx'); });
    const canvas = fakeCanvas({ top: 0, bottom: 1 });
    expect(() => mountPortrait(canvas)).not.toThrow();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(canvas.hidden).toBe(true);
    expect(m.register).not.toHaveBeenCalled();
  });

  it('under reduced motion paints once with every lit cell resolved and never registers', () => {
    m.prefersReducedMotion.mockReturnValue(true);
    mountPortrait(fakeCanvas({ top: 0, bottom: 1 }));
    expect(m.register).not.toHaveBeenCalled();
    expect(m.paintCells).toHaveBeenCalledTimes(1);
    const cells = m.paintCells.mock.calls[0][2] as ({ cov: number } | undefined)[];
    const vals = portrait.cells as number[];
    expect(cells.filter(Boolean)).toHaveLength(lit);
    vals.forEach((v, k) => {
      if (v > 0) expect(cells[k]!.cov).toBeCloseTo(0.35 + 0.65 * v, 10);
      else expect(cells[k]).toBeUndefined();
    });
  });

  it('once fully revealed, later frames do not repaint', () => {
    m.register.mockReturnValue({ stop: vi.fn() });
    mountPortrait(fakeCanvas({ top: 0, bottom: 800 })); // fully in view
    const anim = m.register.mock.calls[0][0] as { frame: (now: number) => void };
    anim.frame(1); // reaches revealed >= 1, paints final
    const n = m.paintCells.mock.calls.length;
    anim.frame(2); anim.frame(3);
    expect(m.paintCells).toHaveBeenCalledTimes(n);
  });

  it('latches: once revealed, scrolling out does not repaint back to noise', () => {
    m.register.mockReturnValue({ stop: vi.fn() });
    const rect = { top: 0, bottom: 800 };
    mountPortrait(fakeCanvas(rect));
    const anim = m.register.mock.calls[0][0] as { frame: (now: number) => void };
    anim.frame(1); // progress 1
    const n = m.paintCells.mock.calls.length;
    rect.top = -2000; rect.bottom = -1000; // progress 0
    anim.frame(2); anim.frame(3);
    expect(m.paintCells).toHaveBeenCalledTimes(n);
    const last = m.paintCells.mock.calls[n - 1][2] as unknown[];
    expect(last.filter(Boolean)).toHaveLength(lit);
  });

  it('at partial progress paints some resolved cells and some unresolved', () => {
    m.register.mockReturnValue({ stop: vi.fn() });
    mountPortrait(fakeCanvas({ top: 800 - 0.5 * 0.28 * 800, bottom: 800 })); // progress 0.5
    const anim = m.register.mock.calls[0][0] as { frame: (now: number) => void };
    anim.frame(1);
    const cells = m.paintCells.mock.calls.at(-1)![2] as ({ cov: number; lum: number } | undefined)[];
    const vals = portrait.cells as number[];
    const resolved = cells.filter((c, k) => c && c.lum === vals[k] && c.cov === 0.35 + 0.65 * vals[k]).length;
    expect(resolved).toBeGreaterThan(0);
    expect(resolved).toBeLessThan(lit);
  });

  it('once resolved, scatters the dots under the pointer, then repaints only until they are home', () => {
    m.register.mockReturnValue({ stop: vi.fn() });
    const canvas = fakeCanvas({ top: 0, bottom: 800 });
    mountPortrait(canvas);
    const anim = m.register.mock.calls[0][0] as { frame: (t: number, dt: number) => void };
    anim.frame(1, 0); // resolved
    const { k, x, y } = litCellCentre();
    canvas.fire('pointermove', x + 3, y);
    anim.frame(1.1, 1 / 30);
    const cells = m.paintCells.mock.calls.at(-1)![2] as ({ dx: number } | undefined)[];
    expect(cells[k]!.dx).toBeLessThan(0); // pushed left, away from the pointer on its right

    canvas.fire('pointerleave');
    let t = 1.1;
    for (let i = 0; i < 150; i++) anim.frame((t += 1 / 30), 1 / 30);
    const n = m.paintCells.mock.calls.length;
    const last = m.paintCells.mock.calls[n - 1][2] as ({ dx: number; dy: number } | undefined)[];
    expect(last.every((c) => !c || (c.dx === 0 && c.dy === 0))).toBe(true);
    anim.frame((t += 1 / 30), 1 / 30);
    expect(m.paintCells).toHaveBeenCalledTimes(n); // settled: no more repaints
  });

  it('maps the pointer into the canvas when a max-width has scaled it down', () => {
    m.register.mockReturnValue({ stop: vi.fn() });
    const canvas = fakeCanvas({ top: 0, bottom: 800 });
    (canvas as unknown as { getBoundingClientRect: () => object }).getBoundingClientRect = () => ({ left: 10, top: 20, width: portrait.cols * 2 });
    mountPortrait(canvas);
    const anim = m.register.mock.calls[0][0] as { frame: (t: number, dt: number) => void };
    anim.frame(1, 0);
    const { k, x, y } = litCellCentre();
    canvas.fire('pointermove', 10 + (x + 3) / 2, 20 + y / 2); // half size on screen
    anim.frame(1.1, 1 / 30);
    const cells = m.paintCells.mock.calls.at(-1)![2] as ({ dx: number } | undefined)[];
    expect(cells[k]!.dx).toBeLessThan(0);
  });

  it('under reduced motion does not listen for the pointer', () => {
    m.prefersReducedMotion.mockReturnValue(true);
    const canvas = fakeCanvas({ top: 0, bottom: 1 });
    mountPortrait(canvas);
    expect(Object.keys(canvas.listeners)).toHaveLength(0);
  });
});

describe('mountWhoami', () => {
  const NAME = 'Mikkel Jørgensen';
  /** the title's markup, server-rendered with the full name; the frame's box decides focus */
  function fakeTitle(rect: { top: number; bottom: number }) {
    const name = { textContent: NAME };
    const cursor = { style: { visibility: '' } };
    const frame = { getBoundingClientRect: () => rect };
    const root = {
      closest: () => frame,
      querySelector: (sel: string) => ({ '[data-whoami-name]': name, '[data-whoami-cursor]': cursor })[sel] ?? null,
    } as unknown as HTMLElement;
    return { root, name, cursor };
  }
  const frameOf = () => m.register.mock.calls[0][0] as { frame: (t: number) => void };

  it('clears the name, then types it out once the section comes into focus', () => {
    m.register.mockReturnValue({ stop: vi.fn() });
    const rect = { top: 900, bottom: 1500 }; // below the fold
    const { root, name, cursor } = fakeTitle(rect);
    mountWhoami(root);
    expect(name.textContent).toBe('');
    frameOf().frame(10);
    expect(name.textContent).toBe('');
    expect(cursor.style.visibility).toBe('');

    rect.top = 100; rect.bottom = 700; // in focus at t = 20
    frameOf().frame(20);
    frameOf().frame(20 + TYPE_DELAY_S + 6.5 * TYPE_S);
    expect(name.textContent).toBe('Mikkel');
    frameOf().frame(20 + 5);
    expect(name.textContent).toBe(NAME);
  });

  it('types once: scrolling away and back does not restart it', () => {
    m.register.mockReturnValue({ stop: vi.fn() });
    const rect = { top: 100, bottom: 700 };
    const { root, name } = fakeTitle(rect);
    mountWhoami(root);
    frameOf().frame(1);
    frameOf().frame(5);
    rect.top = -2000; rect.bottom = -1400;
    frameOf().frame(6);
    rect.top = 100; rect.bottom = 700;
    frameOf().frame(7);
    expect(name.textContent).toBe(NAME);
  });

  it('under reduced motion leaves the full name and a steady cursor, and never registers', () => {
    m.prefersReducedMotion.mockReturnValue(true);
    const { root, name, cursor } = fakeTitle({ top: 0, bottom: 1 });
    mountWhoami(root);
    expect(name.textContent).toBe(NAME);
    expect(cursor.style.visibility).toBe('');
    expect(m.register).not.toHaveBeenCalled();
  });

  it('on a frame failure reports once, restores the name and cursor, and stops once', () => {
    const stop = vi.fn();
    m.register.mockReturnValue({ stop });
    const { root, name, cursor } = fakeTitle({ top: 100, bottom: 700 });
    (root as unknown as { closest: () => unknown }).closest = () => ({ getBoundingClientRect: () => { throw new Error('boom'); } });
    mountWhoami(root);
    cursor.style.visibility = 'hidden';
    expect(() => { frameOf().frame(1); frameOf().frame(2); }).not.toThrow();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(name.textContent).toBe(NAME);
    expect(cursor.style.visibility).toBe('');
  });
});
