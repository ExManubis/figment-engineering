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

import { mountHeroMarks } from './mount';
import { LOCATION, WORDMARK } from './text';

/** the row's markup as plain objects, server-rendered in its finished state */
function fakeRow() {
  const canvas = {};
  const wordmark = { textContent: WORDMARK };
  const location = { textContent: LOCATION };
  const copyright = { textContent: '© 2026 ', dataset: { text: '© 2026' } };
  const attrs: Record<string, string> = {};
  const root = {
    querySelector: (sel: string) => ({
      '[data-mark-cube]': canvas, '[data-mark-wordmark]': wordmark, '[data-mark-location]': location, '[data-mark-copyright]': copyright,
    })[sel] ?? null,
    setAttribute: (k: string, v: string) => { attrs[k] = v; },
  } as unknown as HTMLElement;
  return { root, wordmark, location, copyright, attrs };
}

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  m.prefersReducedMotion.mockReturnValue(false);
  m.setupCanvas.mockReturnValue({});
});

describe('mountHeroMarks', () => {
  it('animates every mark from one scheduled frame', () => {
    m.register.mockReturnValue({ stop: vi.fn() });
    const { root, wordmark, copyright } = fakeRow();
    mountHeroMarks(root);
    const anim = m.register.mock.calls[0][0] as { frame: (now: number) => void };
    anim.frame(100); // the first frame starts every loop from the top
    expect(wordmark.textContent).toBe(WORDMARK.replace(/\S/g, ' '));
    expect(copyright.textContent).toBe('      █');
    expect(m.paintCells).toHaveBeenCalledTimes(1);
  });

  it('under reduced motion paints a still cube, leaves the finished text and never registers', () => {
    m.prefersReducedMotion.mockReturnValue(true);
    const { root, wordmark, copyright } = fakeRow();
    mountHeroMarks(root);
    expect(m.paintCells).toHaveBeenCalledTimes(1);
    expect(m.register).not.toHaveBeenCalled();
    expect(wordmark.textContent).toBe(WORDMARK);
    expect(copyright.textContent).toBe('© 2026 ');
  });

  it('on a frame failure reports once, restores the finished text, shows the fallback and stops once', () => {
    const stop = vi.fn();
    m.register.mockReturnValue({ stop });
    const { root, wordmark, location, copyright, attrs } = fakeRow();
    mountHeroMarks(root);
    m.paintCells.mockImplementation(() => { throw new Error('boom'); });
    const anim = m.register.mock.calls[0][0] as { frame: (now: number) => void };
    expect(() => { anim.frame(1); anim.frame(1.1); }).not.toThrow();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(attrs['data-fallback']).toBe('');
    expect(wordmark.textContent).toBe(WORDMARK);
    expect(location.textContent).toBe(LOCATION);
    expect(copyright.textContent).toBe('© 2026 ');
  });
});
