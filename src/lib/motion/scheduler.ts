import { reportError } from '../report';

export interface Animation {
  /** Element whose visibility gates the animation; omit to run whenever the page is visible. */
  el?: Element;
  /** Maximum frames per second (default 60). */
  fps?: number;
  /** t: page time in seconds. dt: seconds since this animation last ran, clamped to 0.1 (0 on first run/resume). */
  frame(t: number, dt: number): void;
}

export interface Handle {
  stop(): void;
}

export interface SchedulerDeps {
  raf(cb: (nowMs: number) => void): void;
  observe(el: Element, onChange: (visible: boolean) => void): () => void;
  onError(err: unknown): void;
}

interface Entry {
  a: Animation;
  visible: boolean;
  last: number | null;
  unobserve: () => void;
}

export function createScheduler(deps: SchedulerDeps) {
  const entries = new Set<Entry>();
  let running = false;

  const remove = (e: Entry) => {
    e.unobserve();
    entries.delete(e);
  };

  const tick = (now: number) => {
    for (const e of [...entries]) {
      if (!e.visible) {
        e.last = null;
        continue;
      }
      const minGap = 1000 / (e.a.fps ?? 60) - 1;
      if (e.last !== null && now - e.last < minGap) continue;
      const dt = e.last === null ? 0 : Math.min((now - e.last) / 1000, 0.1);
      e.last = now;
      try {
        e.a.frame(now / 1000, dt);
      } catch (err) {
        remove(e);
        deps.onError(err);
      }
    }
    if (entries.size) deps.raf(tick);
    else running = false;
  };

  return {
    register(a: Animation): Handle {
      const e: Entry = { a, visible: !a.el, last: null, unobserve: () => {} };
      if (a.el) e.unobserve = deps.observe(a.el, (v) => { e.visible = v; });
      entries.add(e);
      if (!running) {
        running = true;
        deps.raf(tick);
      }
      return { stop: () => remove(e) };
    },
  };
}

let browser: ReturnType<typeof createScheduler> | null = null;

function browserScheduler() {
  if (browser) return browser;
  const callbacks = new Map<Element, Set<(v: boolean) => void>>();
  const io = new IntersectionObserver((records) => {
    for (const r of records) {
      callbacks.get(r.target)?.forEach((cb) => cb(r.isIntersecting));
    }
  });
  browser = createScheduler({
    raf: (cb) => { requestAnimationFrame(cb); },
    observe: (el, cb) => {
      if (!callbacks.has(el)) {
        callbacks.set(el, new Set());
        io.observe(el);
      }
      callbacks.get(el)!.add(cb);
      return () => {
        callbacks.get(el)!.delete(cb);
        if (callbacks.get(el)!.size === 0) {
          callbacks.delete(el);
          io.unobserve(el);
        }
      };
    },
    onError: reportError,
  });
  return browser;
}

export function register(a: Animation): Handle {
  return browserScheduler().register(a);
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
