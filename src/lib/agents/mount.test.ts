import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  register: vi.fn(),
  prefersReducedMotion: vi.fn(),
  reportError: vi.fn(),
  track: vi.fn(),
}));
vi.mock('../motion/scheduler', () => ({ register: m.register, prefersReducedMotion: m.prefersReducedMotion }));
vi.mock('../report', () => ({ reportError: m.reportError }));
vi.mock('../analytics', () => ({ track: m.track }));

import { mountPrompttyDemo, renderFrame } from './mount';
import { frameAt, PANE, STILL_MS, TABS } from './timeline';

const io = vi.hoisted(() => ({ instances: [] as { cb: (r: { intersectionRatio: number }[]) => void; disconnect: () => void }[] }));
class FakeIO {
  disconnect = vi.fn();
  observe = vi.fn();
  constructor(public cb: (r: { intersectionRatio: number }[]) => void) { io.instances.push(this); }
}

/** the demo's markup as plain objects: one element per tab (with its status) and per pane line, and the toast */
function fakeRoot() {
  const tabs = Object.fromEntries(TABS.map((t) => [t.id, { dataset: {} as Record<string, string>, status: { textContent: '' } }]));
  for (const t of Object.values(tabs)) Object.assign(t, { querySelector: () => t.status });
  const lines = PANE.map(() => ({ hidden: false }));
  const toast = { dataset: {} as Record<string, string> };
  const replay = { addEventListener: vi.fn(), disabled: false };
  const root = {
    querySelector: (sel: string) => {
      const tab = sel.match(/^\[data-tab="(.+)"\]$/);
      if (tab) return tabs[tab[1]] ?? null;
      return sel === '[data-toast]' ? toast : sel === '[data-replay]' ? replay : null;
    },
    querySelectorAll: (sel: string) => (sel === '[data-line]' ? lines : []),
  } as unknown as HTMLElement;
  return { root, tabs, lines, toast, replay };
}

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  io.instances.length = 0;
  vi.stubGlobal('IntersectionObserver', FakeIO);
  m.prefersReducedMotion.mockReturnValue(false);
});

describe('renderFrame', () => {
  it('sets each tab, shows the pane so far and the toast', () => {
    const { root, tabs, lines, toast } = fakeRoot();
    renderFrame(root, frameAt(STILL_MS));
    expect(tabs.claude.dataset.state).toBe('permission');
    expect(tabs.claude.status.textContent).toBe('wants to run Bash');
    expect(tabs.dev.dataset.state).toBe('');
    expect(toast.dataset.show).toBe('true');
    const shown = frameAt(STILL_MS).pane.length;
    expect(lines.map((l) => l.hidden)).toEqual(PANE.map((_, i) => i >= shown));
  });
});

describe('mountPrompttyDemo', () => {
  it('starts from the top once half on screen, and replays on click', () => {
    m.register.mockReturnValue({ stop: vi.fn() });
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const { root, tabs, toast, replay } = fakeRoot();
    mountPrompttyDemo(root);
    io.instances[0].cb([{ intersectionRatio: 1 }]);
    expect(tabs.claude.dataset.state).toBe('working');
    const anim = m.register.mock.calls[0][0] as { frame: (now: number) => void };
    anim.frame(1 + STILL_MS / 1000);
    expect(toast.dataset.show).toBe('true');
    (replay.addEventListener.mock.calls[0][1] as () => void)();
    expect(toast.dataset.show).toBe('false');
    expect(m.track).toHaveBeenCalledWith('promptty_demo_replayed');
  });

  it('on a frame failure reports once, falls back to the still frame and stops exactly once', () => {
    const stop = vi.fn();
    m.register.mockReturnValue({ stop });
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const { root, tabs, replay } = fakeRoot();
    mountPrompttyDemo(root);
    io.instances[0].cb([{ intersectionRatio: 1 }]);
    const anim = m.register.mock.calls[0][0] as { frame: (now: number) => void };
    const get = vi.spyOn(root, 'querySelector').mockImplementationOnce(() => { throw new Error('boom'); });
    expect(() => { anim.frame(2); anim.frame(2.1); }).not.toThrow();
    get.mockRestore();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(io.instances[0].disconnect).toHaveBeenCalled();
    expect(replay.disabled).toBe(true);
    expect(tabs.claude.dataset.state).toBe('permission');
  });

  it('under reduced motion keeps the server-rendered still frame and never registers', () => {
    m.prefersReducedMotion.mockReturnValue(true);
    const { root, tabs, replay } = fakeRoot();
    mountPrompttyDemo(root);
    expect(replay.disabled).toBe(true);
    expect(tabs.claude.dataset.state).toBeUndefined();
    expect(m.register).not.toHaveBeenCalled();
    expect(io.instances).toHaveLength(0);
  });
});
