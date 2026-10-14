import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { mountNavLogo } from './nav';

function fakeCanvas() {
  const link = { setAttribute: vi.fn() };
  const canvas = { closest: vi.fn(() => link) } as unknown as HTMLCanvasElement;
  return { canvas, link };
}

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  m.prefersReducedMotion.mockReturnValue(false);
  m.setupCanvas.mockReturnValue({});
});

describe('mountNavLogo', () => {
  it('on a frame failure reports once, shows the fallback and stops the handle exactly once', () => {
    const stop = vi.fn();
    m.register.mockReturnValue({ stop });
    m.paintCells.mockImplementation(() => { throw new Error('boom'); });
    const { canvas, link } = fakeCanvas();
    mountNavLogo(canvas);
    const anim = m.register.mock.calls[0][0] as { frame: (now: number) => void };
    expect(() => { anim.frame(0); anim.frame(0.1); anim.frame(0.2); }).not.toThrow();
    expect(link.setAttribute).toHaveBeenCalledWith('data-fallback', '');
    expect(stop).toHaveBeenCalledTimes(1);
    expect(m.reportError).toHaveBeenCalledTimes(1);
  });

  it('on a setup failure reports, shows the fallback and never registers', () => {
    m.setupCanvas.mockImplementation(() => { throw new Error('no ctx'); });
    const { canvas, link } = fakeCanvas();
    expect(() => mountNavLogo(canvas)).not.toThrow();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(link.setAttribute).toHaveBeenCalledWith('data-fallback', '');
    expect(m.register).not.toHaveBeenCalled();
  });

  it('paints a single static frame under reduced motion', () => {
    m.prefersReducedMotion.mockReturnValue(true);
    mountNavLogo(fakeCanvas().canvas);
    expect(m.paintCells).toHaveBeenCalledTimes(1);
    expect(m.register).not.toHaveBeenCalled();
  });
});
