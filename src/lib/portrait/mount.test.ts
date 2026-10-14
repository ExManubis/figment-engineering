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
import { mountPortrait } from './mount';

const lit = (portrait.cells as number[]).filter((v) => v > 0).length;

function fakeCanvas(rect: { top: number; bottom: number }) {
  const frame = { getBoundingClientRect: () => rect };
  return { hidden: false, closest: () => frame } as unknown as HTMLCanvasElement & { hidden: boolean };
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
    const frame = { getBoundingClientRect: () => rect };
    mountPortrait({ hidden: false, closest: () => frame } as unknown as HTMLCanvasElement);
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
});
