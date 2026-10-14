import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  register: vi.fn(),
  prefersReducedMotion: vi.fn(),
  setupCanvas: vi.fn(),
  paintCells: vi.fn(),
  reportError: vi.fn(),
  track: vi.fn(),
}));
vi.mock('../motion/scheduler', () => ({ register: m.register, prefersReducedMotion: m.prefersReducedMotion }));
vi.mock('../dotgrid/paint', async (orig) => ({
  ...(await orig<typeof import('../dotgrid/paint')>()),
  setupCanvas: m.setupCanvas,
  paintCells: m.paintCells,
}));
vi.mock('../report', () => ({ reportError: m.reportError }));
vi.mock('../analytics', () => ({ track: m.track }));

import { TRANSCRIPT } from './demo';
import { mountClaudewitzDemo } from './mount';

const io = vi.hoisted(() => ({ instances: [] as { cb: (r: { intersectionRatio: number }[]) => void; disconnect: () => void }[] }));
class FakeIO {
  disconnect = vi.fn();
  observe = vi.fn();
  constructor(public cb: (r: { intersectionRatio: number }[]) => void) { io.instances.push(this); }
}

function fakeRoot() {
  const term = { textContent: '' };
  const canvas = { hidden: false, style: {} as Record<string, string> };
  const replay = { addEventListener: vi.fn() };
  const root = {
    querySelector: (sel: string) => (sel === '[data-terminal]' ? term : sel === '[data-bean]' ? canvas : sel === '[data-replay]' ? replay : null),
  } as unknown as HTMLElement;
  return { root, term, canvas };
}

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  io.instances.length = 0;
  vi.stubGlobal('IntersectionObserver', FakeIO);
  m.prefersReducedMotion.mockReturnValue(false);
  m.setupCanvas.mockReturnValue({});
});

describe('mountClaudewitzDemo', () => {
  it('on a frame failure reports once, restores the transcript, hides the bean and stops exactly once', () => {
    const stop = vi.fn();
    m.register.mockReturnValue({ stop });
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const { root, term, canvas } = fakeRoot();
    mountClaudewitzDemo(root);
    io.instances[0].cb([{ intersectionRatio: 1 }]); // start; restart's paint succeeds
    m.paintCells.mockImplementation(() => { throw new Error('boom'); });
    const anim = m.register.mock.calls[0][0] as { frame: (now: number) => void };
    expect(() => { anim.frame(100); anim.frame(100.1); anim.frame(100.2); }).not.toThrow();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(term.textContent).toBe(TRANSCRIPT);
    expect(canvas.hidden).toBe(true);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(io.instances[0].disconnect).toHaveBeenCalled();
  });

  it('on a setup failure reports, shows the transcript and never registers', () => {
    m.setupCanvas.mockImplementation(() => { throw new Error('no ctx'); });
    const { root, term, canvas } = fakeRoot();
    expect(() => mountClaudewitzDemo(root)).not.toThrow();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(term.textContent).toBe(TRANSCRIPT);
    expect(canvas.hidden).toBe(true);
    expect(m.register).not.toHaveBeenCalled();
  });

  it('under reduced motion shows the transcript, paints once and never registers', () => {
    m.prefersReducedMotion.mockReturnValue(true);
    const { root, term } = fakeRoot();
    mountClaudewitzDemo(root);
    expect(term.textContent).toBe(TRANSCRIPT);
    expect(m.paintCells).toHaveBeenCalledTimes(1);
    expect(m.register).not.toHaveBeenCalled();
  });
});
