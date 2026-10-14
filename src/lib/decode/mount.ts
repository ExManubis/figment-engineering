import { prefersReducedMotion, register, type Handle } from '../motion/scheduler';
import { reportError } from '../report';
import { fitPre } from '../type/fit';
import { FRAME_BAND, inFocus, layoutFrame, renderFrame, stepProgress, type FrameLayout } from './frame';
import { hashString, mulberry32 } from './rng';
import { decodeText, makeTextSeeds } from './text';

const LINE_PX = 16;
const HEADER_MAX_PX = 14;

function charWidth(pre: HTMLElement): number {
  const probe = document.createElement('span');
  probe.textContent = '──────────';
  pre.appendChild(probe);
  const w = probe.getBoundingClientRect().width / 10;
  probe.remove();
  return w > 0 ? w : 8;
}

function mountOne(el: HTMLElement): void {
  const border = el.querySelector<HTMLElement>('.decode-frame__border');
  if (!border) return;
  const label = el.dataset.label ?? '';
  const rng = mulberry32(hashString(label));
  const headers = [...el.querySelectorAll<HTMLElement>('[data-ascii-header]')].map((h) => ({
    el: h,
    text: h.textContent ?? '',
    seeds: [] as number[],
  }));
  let layout: FrameLayout = { cols: 0, rows: 0, cells: [] };
  let p = 0;
  let lastP = -1;
  let handle: Handle | undefined;
  let failed = false;

  const fail = (err: unknown) => {
    if (failed) return;
    failed = true;
    reportError(err);
    el.setAttribute('data-failed', '');
    border.textContent = '';
    for (const h of headers) h.el.textContent = h.text;
    handle?.stop();
    handle = undefined;
  };

  const relayout = () => {
    const cw = charWidth(border);
    layout = layoutFrame(el.clientWidth / cw, el.clientHeight / LINE_PX, label, rng);
    for (const h of headers) {
      h.el.textContent = h.text;
      fitPre(h.el, HEADER_MAX_PX);
      h.seeds = makeTextSeeds(h.text, rng, FRAME_BAND);
    }
    lastP = -1;
  };
  const safeRelayout = () => {
    if (failed) return;
    try {
      relayout();
    } catch (err) {
      fail(err);
    }
  };

  try {
    relayout();
    new ResizeObserver(safeRelayout).observe(el);
    document.fonts?.ready.then(safeRelayout).catch(fail);

    const reduced = prefersReducedMotion();
    handle = register({
      el,
      fps: 30,
      // Progress is timed rather than scroll-linked: the frame plays its full scramble-and-settle
      // when the section comes into focus, and dissolves when it leaves.
      frame: (_t, dt) => {
        try {
          const r = el.getBoundingClientRect();
          const focused = inFocus(r.top, r.bottom, window.innerHeight);
          // dt is 0 on the first frame after the section scrolls back into view: start dissolved
          // unless it is already in focus, so a quick scroll past never shows a stale frame
          if (dt === 0 && !focused) p = 0;
          p = reduced ? 1 : stepProgress(p, focused, dt);
          if ((p <= 0 || p >= 1) && p === lastP) return;
          lastP = p;
          border.textContent = renderFrame(layout, p, rng);
          for (const h of headers) h.el.textContent = decodeText(h.text, h.seeds, p, rng, FRAME_BAND);
          el.toggleAttribute('data-active', p > 0.5);
        } catch (err) {
          fail(err);
        }
      },
    });
    if (failed) handle.stop();
  } catch (err) {
    fail(err);
  }
}

export function mountDecodeFrames(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-decode-frame]:not([data-mounted])').forEach((el) => {
    el.dataset.mounted = '';
    try {
      mountOne(el);
    } catch (err) {
      reportError(err);
      el.setAttribute('data-failed', '');
    }
  });
}
