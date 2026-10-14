/** Shrink a <pre> so its longest line fits its width; never larger than maxPx. */
export function fitPre(el: HTMLElement, maxPx: number): void {
  el.style.fontSize = `${maxPx}px`;
  const ratio = el.clientWidth / Math.max(1, el.scrollWidth);
  if (ratio < 1) el.style.fontSize = `${(maxPx * ratio).toFixed(2)}px`;
}
