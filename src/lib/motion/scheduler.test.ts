import { describe, expect, it, vi } from 'vitest';
import { createScheduler, createVisibilityRegistry } from './scheduler';

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

  it('supports multiple animations on the same element', () => {
    let queued: ((now: number) => void)[] = [];
    const callbacks = new Map<Element, Set<(v: boolean) => void>>();
    const onError = vi.fn();
    const s = createScheduler({
      raf: (cb) => { queued.push(cb); },
      observe: (el, cb) => {
        if (!callbacks.has(el)) callbacks.set(el, new Set());
        callbacks.get(el)!.add(cb);
        return () => {
          callbacks.get(el)!.delete(cb);
          if (callbacks.get(el)!.size === 0) callbacks.delete(el);
        };
      },
      onError,
    });
    const flush = (now: number) => { const q = queued; queued = []; q.forEach((cb) => cb(now)); };

    const el = {} as Element;
    const frame1 = vi.fn();
    const frame2 = vi.fn();
    const h1 = s.register({ el, frame: frame1 });
    const h2 = s.register({ el, frame: frame2 });

    // Both start with visibility paused (el not in IntersectionObserver yet)
    flush(1000);
    expect(frame1).toHaveBeenCalledTimes(0);
    expect(frame2).toHaveBeenCalledTimes(0);

    // Notify both callbacks that element is visible
    for (const cb of callbacks.get(el) || []) cb(true);
    flush(1000);
    expect(frame1).toHaveBeenCalledTimes(1);
    expect(frame2).toHaveBeenCalledTimes(1);

    // Stop one animation
    h1.stop();
    flush(1016);
    expect(frame1).toHaveBeenCalledTimes(1); // Still 1, stopped
    expect(frame2).toHaveBeenCalledTimes(2); // Got the update

    // Notify invisibility; second animation should still receive it
    for (const cb of callbacks.get(el) || []) cb(false);
    flush(2000);
    expect(frame2).toHaveBeenCalledTimes(2); // No new call while invisible

    // Notify visibility again; second animation should resume
    for (const cb of callbacks.get(el) || []) cb(true);
    flush(3000);
    expect(frame2).toHaveBeenCalledTimes(3);
  });
});

describe('visibility registry', () => {
  it('two callbacks on one element both receive updates', () => {
    let recordsCallback: ((records: { target: Element; isIntersecting: boolean }[]) => void) | null = null;
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
    };
    const registry = createVisibilityRegistry((cb) => {
      recordsCallback = cb;
      return mockObserver;
    });

    const el = {} as Element;
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    registry.observe(el, cb1);
    registry.observe(el, cb2);

    // Simulate IntersectionObserver notification
    recordsCallback?.([{ target: el, isIntersecting: true }]);
    expect(cb1).toHaveBeenCalledWith(true);
    expect(cb2).toHaveBeenCalledWith(true);

    recordsCallback?.([{ target: el, isIntersecting: false }]);
    expect(cb1).toHaveBeenCalledWith(false);
    expect(cb2).toHaveBeenCalledWith(false);
  });

  it('stopping one callback keeps the other updating and does not unobserve', () => {
    let recordsCallback: ((records: { target: Element; isIntersecting: boolean }[]) => void) | null = null;
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
    };
    const registry = createVisibilityRegistry((cb) => {
      recordsCallback = cb;
      return mockObserver;
    });

    const el = {} as Element;
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const stop1 = registry.observe(el, cb1);
    registry.observe(el, cb2);
    expect(mockObserver.observe).toHaveBeenCalledTimes(1);

    recordsCallback?.([{ target: el, isIntersecting: true }]);
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);

    stop1();
    expect(mockObserver.unobserve).toHaveBeenCalledTimes(0);

    recordsCallback?.([{ target: el, isIntersecting: false }]);
    expect(cb1).toHaveBeenCalledTimes(1); // Not called again
    expect(cb2).toHaveBeenCalledTimes(2);
  });

  it('stopping the last callback unobserves', () => {
    let recordsCallback: ((records: { target: Element; isIntersecting: boolean }[]) => void) | null = null;
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
    };
    const registry = createVisibilityRegistry((cb) => {
      recordsCallback = cb;
      return mockObserver;
    });

    const el = {} as Element;
    const cb1 = vi.fn();

    const stop1 = registry.observe(el, cb1);
    expect(mockObserver.observe).toHaveBeenCalledTimes(1);
    expect(mockObserver.unobserve).toHaveBeenCalledTimes(0);

    stop1();
    expect(mockObserver.unobserve).toHaveBeenCalledTimes(1);
  });

  it('callback added after notification is immediately called with last known visibility', () => {
    let recordsCallback: ((records: { target: Element; isIntersecting: boolean }[]) => void) | null = null;
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
    };
    const registry = createVisibilityRegistry((cb) => {
      recordsCallback = cb;
      return mockObserver;
    });

    const el = {} as Element;
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    registry.observe(el, cb1);

    // Simulate IntersectionObserver notification
    recordsCallback?.([{ target: el, isIntersecting: true }]);
    expect(cb1).toHaveBeenCalledWith(true);

    // Register second callback - should be immediately called with last known visibility
    registry.observe(el, cb2);
    expect(cb2).toHaveBeenCalledWith(true);

    // Simulate another notification
    recordsCallback?.([{ target: el, isIntersecting: false }]);
    expect(cb1).toHaveBeenCalledTimes(2);
    expect(cb2).toHaveBeenCalledTimes(2);
  });
});
