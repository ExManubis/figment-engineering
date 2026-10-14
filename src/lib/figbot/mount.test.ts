import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  register: vi.fn(),
  prefersReducedMotion: vi.fn(),
  reportError: vi.fn(),
}));
vi.mock('../motion/scheduler', () => ({ register: m.register, prefersReducedMotion: m.prefersReducedMotion }));
vi.mock('../report', () => ({ reportError: m.reportError }));

import { GRID, POSES, cells } from '../../../figbot/src/model';
import { dotRadius } from '../../../figbot/src/svg';
import { poseAt } from '../../../figbot/src/timeline';
import { drawPose, mountFigbotDemo } from './mount';

const fakeCtx = () => ({
  clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), arc: vi.fn(), fill: vi.fn(), setTransform: vi.fn(), fillStyle: '',
});

/** the demo's markup as plain objects: a hidden canvas over the server-rendered still */
function fakeRoot(ctx: ReturnType<typeof fakeCtx> | null = fakeCtx()) {
  const canvas = { hidden: true, width: 0, height: 0, clientWidth: 400, getContext: vi.fn(() => ctx) };
  const still = { hidden: false };
  const root = {
    querySelector: (sel: string) => (sel === '[data-figbot-canvas]' ? canvas : sel === '[data-figbot-still]' ? still : null),
  } as unknown as HTMLElement;
  return { root, canvas, still, ctx };
}

const dots = (pose = POSES.idle) => Array.from(cells(pose, GRID, GRID)).filter((l) => dotRadius(l) > 0);

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  m.prefersReducedMotion.mockReturnValue(false);
});

describe('drawPose', () => {
  it('paints one dot per lit cell, sized to the square', () => {
    const ctx = fakeCtx();
    drawPose(ctx as unknown as CanvasRenderingContext2D, POSES.idle, 480);
    expect(ctx.arc).toHaveBeenCalledTimes(dots().length);
    const [, , r] = ctx.arc.mock.calls[0];
    expect(r).toBeCloseTo(dotRadius(dots()[0]) * (480 / GRID), 10);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 480, 480);
    expect(ctx.fill).toHaveBeenCalledTimes(1);
  });
});

describe('mountFigbotDemo', () => {
  it('plays the loop from its start once on screen, replacing the still', () => {
    m.register.mockReturnValue({ stop: vi.fn() });
    const { root, canvas, still, ctx } = fakeRoot();
    mountFigbotDemo(root);
    const anim = m.register.mock.calls[0][0] as { el: unknown; frame: (now: number) => void };
    expect(anim.el).toBe(root);
    anim.frame(5); // first visible frame is loop time 0
    expect(ctx!.arc).toHaveBeenCalledTimes(dots(poseAt(0)).length);
    expect(canvas.hidden).toBe(false);
    expect(still.hidden).toBe(true);
    expect(canvas.width).toBe(400);
  });

  it('under reduced motion keeps the still and never registers', () => {
    m.prefersReducedMotion.mockReturnValue(true);
    const { root, canvas, still } = fakeRoot();
    mountFigbotDemo(root);
    expect(m.register).not.toHaveBeenCalled();
    expect(canvas.hidden).toBe(true);
    expect(still.hidden).toBe(false);
  });

  it('on a frame failure reports once, stops once and falls back to the still', () => {
    const stop = vi.fn();
    m.register.mockReturnValue({ stop });
    const { root, canvas, still, ctx } = fakeRoot();
    mountFigbotDemo(root);
    const anim = m.register.mock.calls[0][0] as { frame: (now: number) => void };
    anim.frame(1);
    ctx!.arc.mockImplementation(() => { throw new Error('boom'); });
    expect(() => { anim.frame(1.1); anim.frame(1.2); }).not.toThrow();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(canvas.hidden).toBe(true);
    expect(still.hidden).toBe(false);
  });

  it('without a 2D context reports and keeps the still', () => {
    const { root, canvas, still } = fakeRoot(null);
    mountFigbotDemo(root);
    expect(m.register).not.toHaveBeenCalled();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(canvas.hidden).toBe(true);
    expect(still.hidden).toBe(false);
  });
});
