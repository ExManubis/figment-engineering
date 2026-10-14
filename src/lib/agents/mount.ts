import { track } from '../analytics';
import { prefersReducedMotion, register, type Handle } from '../motion/scheduler';
import { reportError } from '../report';
import { frameAt, STILL_MS, type Frame } from './timeline';

/** Shows `frame` in markup that already holds every tab and pane line (rendered at STILL_MS). */
export function renderFrame(root: HTMLElement, frame: Frame): void {
  for (const t of frame.tabs) {
    const el = root.querySelector<HTMLElement>(`[data-tab="${t.id}"]`);
    if (!el) continue;
    el.dataset.state = t.state ?? '';
    const status = el.querySelector<HTMLElement>('[data-status]');
    if (status) status.textContent = t.detail;
  }
  root.querySelectorAll<HTMLElement>('[data-line]').forEach((el, i) => { el.hidden = i >= frame.pane.length; });
  const toast = root.querySelector<HTMLElement>('[data-toast]');
  if (toast) toast.dataset.show = String(frame.toast);
}

export function mountPrompttyDemo(root: HTMLElement): void {
  const replay = root.querySelector<HTMLButtonElement>('[data-replay]');

  let io: IntersectionObserver | undefined;
  let handle: Handle | undefined;
  let failed = false;

  // Failure falls back to the still frame. Reported once; the handle is stopped at most once.
  const fail = (err: unknown) => {
    if (failed) return;
    failed = true;
    reportError(err);
    try { renderFrame(root, frameAt(STILL_MS)); } catch { /* the server-rendered frame may already be showing */ }
    if (replay) replay.disabled = true;
    io?.disconnect();
    handle?.stop();
    handle = undefined;
  };

  try {
    if (prefersReducedMotion()) {
      if (replay) replay.disabled = true; // the server-rendered still frame stays
      return;
    }

    let started: number | null = null; // seconds
    const restart = (now: number) => {
      started = now;
      renderFrame(root, frameAt(0));
    };

    // start when at least half the demo is on screen; until then the still frame shows
    io = new IntersectionObserver((records) => {
      if (failed || started !== null || !records.some((r) => r.intersectionRatio >= 0.5)) return;
      try {
        restart(performance.now() / 1000);
        io?.disconnect();
      } catch (err) {
        fail(err);
      }
    }, { threshold: 0.5 });
    io.observe(root);

    replay?.addEventListener('click', () => {
      if (failed) return;
      try {
        restart(performance.now() / 1000);
        track('promptty_demo_replayed');
      } catch (err) {
        fail(err);
      }
    });

    handle = register({
      el: root,
      fps: 12,
      frame: (now) => {
        if (failed || started === null) return;
        try {
          renderFrame(root, frameAt((now - started) * 1000));
        } catch (err) {
          fail(err);
        }
      },
    });
  } catch (err) {
    fail(err);
  }
}
