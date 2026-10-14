import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ prefersReducedMotion: vi.fn(), reportError: vi.fn() }));
vi.mock('../motion/scheduler', () => ({ prefersReducedMotion: m.prefersReducedMotion }));
vi.mock('../report', () => ({ reportError: m.reportError }));

import { mountScrollLock } from './mount';

type Handler = (e: Record<string, unknown>) => void;
let handlers: Record<string, Handler>;
let finePointer: boolean;
let frames: ((t: number) => void)[];

/** a 900px window over the fixture page from lock.test.ts, scrolled to `y` */
function fakeWindow(y = 0) {
  const sections = [[0, 900], [1140, 1900], [2140, 2870], [3110, 3800]].map(([top, bottom]) => ({
    dataset: {},
    getBoundingClientRect: () => ({ top: top - win.scrollY, bottom: bottom - win.scrollY }),
  }));
  const win = {
    scrollY: y,
    innerHeight: 900,
    scrollTo: vi.fn(({ top }: { top: number }) => { win.scrollY = top; }),
  };
  vi.stubGlobal('window', Object.assign(win, {
    addEventListener: (type: string, h: Handler) => { handlers[type] = h; },
    matchMedia: () => ({ matches: finePointer }),
  }));
  vi.stubGlobal('document', {
    querySelectorAll: () => sections,
    documentElement: { scrollHeight: 3800 },
    querySelector: () => ({ getBoundingClientRect: () => ({ height: 80 }) }),
  });
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => { frames.push(cb); return frames.length; });
  vi.stubGlobal('performance', { now: () => 0 });
  return win;
}

/** run queued animation frames, `ms` apart, until none are left */
function flush(ms = 1000) {
  let t = 0;
  while (frames.length) { t += ms; frames.shift()!(t); }
}

const wheel = (deltaY: number, timeStamp: number) => {
  const e = { deltaY, deltaX: 0, deltaMode: 0, ctrlKey: false, timeStamp, preventDefault: vi.fn() };
  handlers.wheel(e);
  return e;
};

beforeEach(() => {
  vi.unstubAllGlobals();
  Object.values(m).forEach((f) => f.mockReset());
  m.prefersReducedMotion.mockReturnValue(false);
  handlers = {};
  frames = [];
  finePointer = true;
});

describe('mountScrollLock', () => {
  it('leaves scrolling alone on touch screens and with reduced motion', () => {
    finePointer = false;
    fakeWindow();
    mountScrollLock();
    expect(handlers.wheel).toBeUndefined();

    finePointer = true;
    m.prefersReducedMotion.mockReturnValue(true);
    mountScrollLock();
    expect(handlers.wheel).toBeUndefined();
  });

  it('turns one wheel gesture into one eased move to the next stop', () => {
    const win = fakeWindow();
    mountScrollLock();
    const e = wheel(60, 0);
    expect(e.preventDefault).toHaveBeenCalled();
    flush();
    expect(win.scrollY).toBe(1060);
    expect(win.scrollTo).toHaveBeenLastCalledWith({ top: 1060, behavior: 'instant' });
    wheel(60, 50); // momentum from the same gesture
    flush();
    expect(win.scrollY).toBe(1060);
  });

  it('steps with the keyboard, but not while a modifier is held or a button has focus', () => {
    const win = fakeWindow();
    mountScrollLock();
    const key = (k: string, extra: Record<string, unknown> = {}) => {
      const e = { key: k, shiftKey: false, metaKey: false, ctrlKey: false, altKey: false, target: {}, preventDefault: vi.fn(), ...extra };
      handlers.keydown(e);
      flush();
      return e;
    };
    key('ArrowDown');
    expect(win.scrollY).toBe(1060);
    key('End');
    expect(win.scrollY).toBe(2900);
    key(' ', { shiftKey: true });
    expect(win.scrollY).toBe(2060);
    expect(key('ArrowDown', { metaKey: true }).preventDefault).not.toHaveBeenCalled();
    expect(key(' ', { target: { closest: () => ({}) } }).preventDefault).not.toHaveBeenCalled();
    expect(win.scrollY).toBe(2060);
  });

  it('lets pinch-zoom and sideways scrolling through', () => {
    fakeWindow();
    mountScrollLock();
    const pinch = { deltaY: 60, deltaX: 0, deltaMode: 0, ctrlKey: true, timeStamp: 0, preventDefault: vi.fn() };
    handlers.wheel(pinch);
    const sideways = { deltaY: 5, deltaX: 80, deltaMode: 0, ctrlKey: false, timeStamp: 0, preventDefault: vi.fn() };
    handlers.wheel(sideways);
    expect(pinch.preventDefault).not.toHaveBeenCalled();
    expect(sideways.preventDefault).not.toHaveBeenCalled();
  });
});
