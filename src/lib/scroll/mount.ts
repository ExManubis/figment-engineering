import { prefersReducedMotion } from '../motion/scheduler';
import { reportError } from '../report';
import { nextTarget, stopPositions, WheelGate, type Layout } from './lock';

const DURATION_MS = 700;
const LINE_PX = 16;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * One section per gesture: each wheel gesture or paging key scrolls to the next or previous
 * [data-scroll-stop]. Desktop pointers only, and never under reduced motion; everyone else scrolls normally.
 */
export function mountScrollLock(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || prefersReducedMotion()) return;

  const gate = new WheelGate();
  let animating = false;

  const layout = (): Layout => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const height = document.documentElement.scrollHeight;
    const els = [...document.querySelectorAll<HTMLElement>('[data-scroll-stop]')];
    const sections = els.map((el, i) => {
      const r = el.getBoundingClientRect();
      // the last stop runs to the end of the page, so the footer below it is part of it
      return { top: r.top + y, bottom: i === els.length - 1 ? height : r.bottom + y, center: el.dataset.scrollStop === 'center' };
    });
    const nav = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
    return { sections, vh, nav, max: Math.max(0, height - vh) };
  };

  let run = 0; // a new scroll takes over from one still running
  const scrollTo = (target: number) => {
    const from = window.scrollY;
    if (Math.abs(target - from) < 1) return;
    animating = true;
    gate.setAnimating(true);
    const start = performance.now();
    const id = ++run;
    const step = (now: number) => {
      if (id !== run) return;
      try {
        const t = Math.min(1, (now - start) / DURATION_MS);
        window.scrollTo({ top: from + (target - from) * easeInOutCubic(t), behavior: 'instant' });
        if (t < 1) { requestAnimationFrame(step); return; }
      } catch (err) {
        reportError(err);
      }
      animating = false;
      gate.setAnimating(false);
    };
    requestAnimationFrame(step);
  };

  const go = (dir: 1 | -1) => {
    const target = nextTarget(layout(), window.scrollY, dir);
    if (target !== null) scrollTo(target);
  };

  window.addEventListener('wheel', (e) => {
    try {
      // pinch-zoom arrives as a ctrl+wheel; sideways scrolling belongs to whatever is under the pointer
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * LINE_PX : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      const dir = gate.wheel(dy, e.timeStamp);
      if (dir) go(dir);
    } catch (err) {
      reportError(err);
    }
  }, { passive: false });

  // in-page links to a section, or to a wrapper around one (#work), take the same eased scroll to its stop
  document.addEventListener('click', (e) => {
    try {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = (e.target as Element | null)?.closest?.('a[href^="#"]')?.getAttribute('href');
      const target = href ? document.getElementById(href.slice(1)) : null;
      if (!href || !target) return;
      const stops = [...document.querySelectorAll<HTMLElement>('[data-scroll-stop]')];
      const i = stops.findIndex((el) => el === target || target.contains(el));
      if (i < 0) return;
      e.preventDefault();
      history.pushState(null, '', href);
      scrollTo(stopPositions(layout())[i]);
    } catch (err) {
      reportError(err);
    }
  });

  window.addEventListener('keydown', (e) => {
    try {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as Element | null;
      if (target?.closest?.('input, textarea, select, [contenteditable]')) return;
      // space presses a focused button or link
      if (e.key === ' ' && target?.closest?.('button, a')) return;

      let move: (() => void) | null = null;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) move = () => go(1);
      else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) move = () => go(-1);
      else if (e.key === 'Home') move = () => scrollTo(0);
      else if (e.key === 'End') move = () => scrollTo(stopPositions(layout()).at(-1) ?? 0);
      if (!move) return;
      e.preventDefault();
      if (!animating) move();
    } catch (err) {
      reportError(err);
    }
  });
}
