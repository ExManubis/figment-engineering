import { describe, expect, it, vi } from 'vitest';
import { createScheduler } from './scheduler';

function harness() {
  let queued: ((now: number) => void)[] = [];
  const watchers = new Map<Element, (v: boolean) => void>();
  const onError = vi.fn();
  const s = createScheduler({
    raf: (cb) => { queued.push(cb); },
    observe: (el, cb) => { watchers.set(el, cb); return () => watchers.delete(el); },
    onError,
  });
  const flush = (now: number) => { const q = queued; queued = []; q.forEach((cb) => cb(now)); };
  return { s, flush, watchers, onError, pending: () => queued.length };
}

describe('scheduler', () => {
  it('calls frame on every tick with page time in seconds', () => {
    const h = harness();
    const frame = vi.fn();
    h.s.register({ frame });
    h.flush(1000);
    h.flush(1016);
    expect(frame).toHaveBeenCalledTimes(2);
    expect(frame.mock.calls[0]).toEqual([1, 0]);
    expect(frame.mock.calls[1][0]).toBeCloseTo(1.016);
    expect(frame.mock.calls[1][1]).toBeCloseTo(0.016);
  });

  it('caps the frame rate', () => {
    const h = harness();
    const frame = vi.fn();
    h.s.register({ frame, fps: 30 });
    for (let i = 0; i < 6; i++) h.flush(1000 + i * 16.7);
    expect(frame).toHaveBeenCalledTimes(3);
  });

  it('pauses while its element is off-screen and resumes with dt = 0', () => {
    const h = harness();
    const el = {} as Element;
    const frame = vi.fn();
    h.s.register({ el, frame });
    h.watchers.get(el)!(true);
    h.flush(1000);
    h.watchers.get(el)!(false);
    h.flush(1016);
    h.flush(5000);
    expect(frame).toHaveBeenCalledTimes(1);
    h.watchers.get(el)!(true);
    h.flush(9000);
    expect(frame).toHaveBeenCalledTimes(2);
    expect(frame.mock.calls[1][1]).toBe(0);
  });

  it('clamps dt to 0.1 s after a long gap (e.g. a hidden tab)', () => {
    const h = harness();
    const frame = vi.fn();
    h.s.register({ frame });
    h.flush(1000);
    h.flush(61000);
    expect(frame.mock.calls[1][1]).toBe(0.1);
  });

  it('stops a failing animation, reports it, and keeps the others running', () => {
    const h = harness();
    const bad = vi.fn(() => { throw new Error('boom'); });
    const good = vi.fn();
    h.s.register({ frame: bad });
    h.s.register({ frame: good });
    h.flush(1000);
    h.flush(1016);
    expect(bad).toHaveBeenCalledTimes(1);
    expect(good).toHaveBeenCalledTimes(2);
    expect(h.onError).toHaveBeenCalledTimes(1);
  });

  it('stops requesting frames when nothing is registered', () => {
    const h = harness();
    const handle = h.s.register({ frame: () => {} });
    h.flush(1000);
    handle.stop();
    h.flush(1016);
    expect(h.pending()).toBe(0);
  });
});
