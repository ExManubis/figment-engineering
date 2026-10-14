import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  register: vi.fn(),
  prefersReducedMotion: vi.fn(),
  setupCanvas: vi.fn(),
  paintCells: vi.fn(),
  renderLogo: vi.fn(),
  reportError: vi.fn(),
}));
vi.mock('../motion/scheduler', () => ({ register: m.register, prefersReducedMotion: m.prefersReducedMotion }));
vi.mock('../dotgrid/paint', async (orig) => ({
  ...(await orig<typeof import('../dotgrid/paint')>()),
  setupCanvas: m.setupCanvas,
  paintCells: m.paintCells,
}));
vi.mock('../render/raymarch', () => ({ renderLogo: m.renderLogo }));
vi.mock('../report', () => ({ reportError: m.reportError }));

import { mountHero } from './hero';

const TEXT = "Things I make when no one's asking.";
type Frame = (t: number, dt: number) => void;

let clock = 0;

function fakeHero() {
  const canvas = {};
  const box = { clientWidth: 560, dataset: {} as Record<string, string>, querySelector: () => canvas };
  const decode = { textContent: TEXT, dataset: { text: TEXT } as Record<string, string> };
  const root = {
    querySelector: (sel: string) => (sel === '[data-hero-logo]' ? box : sel === '[data-motto-decode]' ? decode : null),
  } as unknown as HTMLElement;
  return { root, box, decode };
}

function mount() {
  const stop = vi.fn();
  m.register.mockReturnValue({ stop });
  const h = fakeHero();
  mountHero(h.root);
  const frame = m.register.mock.calls[0]?.[0]?.frame as Frame;
  return { ...h, stop, frame };
}

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  clock = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  vi.stubGlobal('window', { innerWidth: 1280, devicePixelRatio: 1, addEventListener: vi.fn() });
  m.prefersReducedMotion.mockReturnValue(false);
  m.setupCanvas.mockReturnValue({});
  m.renderLogo.mockReturnValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('mountHero', () => {
  it('on a frame failure reports once, shows the still image, restores the motto and stops exactly once', () => {
    const { box, decode, stop, frame } = mount();
    m.paintCells.mockImplementation(() => { throw new Error('boom'); });
    expect(() => { frame(1, 0); frame(1.04, 0.04); frame(1.08, 0.04); }).not.toThrow();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(box.dataset.fallback).toBe('');
    expect(decode.textContent).toBe(TEXT);
    expect(decode.dataset.lit).toBe('');
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('paints a single static frame under reduced motion and shows the motto lit at once', () => {
    m.prefersReducedMotion.mockReturnValue(true);
    const { decode } = mount();
    expect(m.paintCells).toHaveBeenCalledTimes(1);
    expect(m.register).not.toHaveBeenCalled();
    expect(decode.textContent).toBe(TEXT);
    expect(decode.dataset.lit).toBe('');
  });

  it('leaves the server-rendered motto in place until the decode starts', () => {
    const { decode, frame } = mount();
    frame(0, 0);
    expect(decode.textContent).toBe(TEXT);
    expect(decode.dataset.lit).toBeUndefined();
  });

  it('a pause followed by one slow frame does not downgrade', () => {
    const { box, frame } = mount();
    m.paintCells.mockImplementation(() => { clock += 80; });
    clock += 10_000; // hero off-screen / tab hidden; the scheduler resumes with dt = 0
    frame(10, 0);
    clock += 10_000;
    frame(20, 0);
    expect(m.setupCanvas).toHaveBeenCalledTimes(1);
    expect(box.dataset.fallback).toBeUndefined();
  });

  it('sustained slow frames downgrade to a coarser grid, then fall back to the still image', () => {
    const { box, stop, frame } = mount();
    m.paintCells.mockImplementation(() => { clock += 80; });
    const run = (n: number, t0: number) => {
      for (let i = 0; i < n; i++) {
        clock += 20;
        frame(t0 + i * 0.1, i === 0 && t0 === 0 ? 0 : 0.1);
      }
    };
    run(30, 0); // 30 samples over 3 s at 80 ms each
    expect(m.setupCanvas).toHaveBeenCalledTimes(2);
    const cols = m.renderLogo.mock.calls.map((c) => c[0].cols as number);
    expect(cols[cols.length - 1]).toBeLessThan(cols[0]);
    expect(box.dataset.fallback).toBeUndefined();
    run(30, 3);
    expect(box.dataset.fallback).toBe('');
    expect(stop).toHaveBeenCalledTimes(1);
    expect(m.reportError).not.toHaveBeenCalled();
  });
});
