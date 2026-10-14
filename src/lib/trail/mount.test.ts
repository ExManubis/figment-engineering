import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ prefersReducedMotion: vi.fn(), setupCanvas: vi.fn(), reportError: vi.fn() }));
vi.mock('../motion/scheduler', () => ({ prefersReducedMotion: m.prefersReducedMotion }));
vi.mock('../dotgrid/paint', () => ({ setupCanvas: m.setupCanvas }));
vi.mock('../report', () => ({ reportError: m.reportError }));

import { mountTrail } from './mount';

type Handler = (e: Record<string, unknown>) => void;
let handlers: Record<string, Handler>;
let frames: (() => void)[];
let finePointer: boolean;
let now: number;

function fakeCtx() {
  return { clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), globalAlpha: 1, fillStyle: '' };
}

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  m.prefersReducedMotion.mockReturnValue(false);
  handlers = {};
  frames = [];
  finePointer = true;
  now = 0;
  vi.stubGlobal('window', {
    innerWidth: 1440,
    innerHeight: 900,
    matchMedia: () => ({ matches: finePointer }),
    addEventListener: (type: string, h: Handler) => { handlers[type] = h; },
    removeEventListener: (type: string) => { delete handlers[type]; },
  });
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => { frames.push(cb); return frames.length; });
  vi.stubGlobal('performance', { now: () => now });
});

describe('mountTrail', () => {
  it('stays off on touch screens and with reduced motion', () => {
    const canvas = { hidden: false } as unknown as HTMLCanvasElement;
    finePointer = false;
    mountTrail(canvas);
    m.prefersReducedMotion.mockReturnValue(true);
    finePointer = true;
    mountTrail(canvas);
    expect(handlers.mousemove).toBeUndefined();
    expect(m.setupCanvas).not.toHaveBeenCalled();
  });

  it('draws a dot where the pointer moves, and stops drawing once it has faded', () => {
    const ctx = fakeCtx();
    m.setupCanvas.mockReturnValue(ctx);
    mountTrail({ hidden: false } as unknown as HTMLCanvasElement);
    handlers.mousemove({ clientX: 25, clientY: 9 });
    frames.shift()!();
    expect(ctx.arc).toHaveBeenCalledWith(25, 5, expect.any(Number), 0, Math.PI * 2);
    expect(frames).toHaveLength(1);
    now = 600;
    frames.shift()!();
    expect(frames).toHaveLength(0);
  });

  it('on a failure reports once, hides the canvas and stops listening', () => {
    const ctx = fakeCtx();
    ctx.arc.mockImplementation(() => { throw new Error('boom'); });
    m.setupCanvas.mockReturnValue(ctx);
    const canvas = { hidden: false } as unknown as HTMLCanvasElement;
    mountTrail(canvas);
    handlers.mousemove({ clientX: 5, clientY: 5 });
    frames.shift()!();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(canvas.hidden).toBe(true);
    expect(handlers.mousemove).toBeUndefined();
  });
});
