import { prefersReducedMotion, register } from '../motion/scheduler';
import { reportError } from '../report';
import { fitPre } from '../type/fit';
import { layoutFrame, renderFrame, scrollProgress, type FrameLayout } from './frame';
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
  let lastP = -1;

  const relayout = () => {
    const cw = charWidth(border);
    layout = layoutFrame(el.clientWidth / cw, el.clientHeight / LINE_PX, label, rng);
    for (const h of headers) {
      h.el.textContent = h.text;
      fitPre(h.el, HEADER_MAX_PX);
      h.seeds = makeTextSeeds(h.text, rng);
    }
    lastP = -1;
  };
  relayout();
  new ResizeObserver(relayout).observe(el);
  document.fonts?.ready.then(relayout).catch(() => {});

  const reduced = prefersReducedMotion();
  register({
    el,
    fps: 30,
    frame: () => {
      const r = el.getBoundingClientRect();
      const p = reduced ? 1 : scrollProgress(r.top, r.bottom, window.innerHeight);
      if ((p <= 0 || p >= 1) && p === lastP) return;
      lastP = p;
      border.textContent = renderFrame(layout, p, rng);
      for (const h of headers) h.el.textContent = decodeText(h.text, h.seeds, p, rng);
      el.toggleAttribute('data-active', p > 0.5);
    },
  });
}

export function mountDecodeFrames(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-decode-frame]:not([data-mounted])').forEach((el) => {
    el.dataset.mounted = '';
    try {
      mountOne(el);
    } catch (err) {
      reportError(err);
    }
  });
}
