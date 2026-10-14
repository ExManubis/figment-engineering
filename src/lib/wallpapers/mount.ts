import { DEVICES, WALLPAPERS, downloadPath, formatBytes, previewPath, type DeviceId } from '../../data/wallpapers';
import { prefersReducedMotion, register, type Handle } from '../motion/scheduler';
import { reportError } from '../report';
import { typedText } from '../type/typed';

/** Below this width the section opens on the iPhone version. */
const PHONE_QUERY = '(max-width: 639px)';

/**
 * The wallpaper section: picking a design or a device swaps the preview (in its device outline), the download link
 * and its size, and retypes the filename header. Server-rendered on Monolith for Mac, which the no-JS page keeps.
 */
export function mountWallpapers(root: HTMLElement): void {
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const previews = [...root.querySelectorAll<HTMLImageElement>('[data-wp-preview]')];
  const designBtns = [...root.querySelectorAll<HTMLElement>('[data-wp-design]')];
  const deviceBtns = [...root.querySelectorAll<HTMLElement>('[data-wp-device]')];
  const pathEl = q('[data-wp-path]'), fileEl = q('[data-wp-file]'), cursorEl = q('[data-wp-cursor]');
  const nameEl = q('[data-wp-name]'), metaEl = q('[data-wp-meta]'), download = q<HTMLAnchorElement>('[data-wp-download]');
  if (!fileEl || !download) return;

  const reduced = prefersReducedMotion();
  let design = 0;
  let device: DeviceId = window.matchMedia(PHONE_QUERY).matches ? 'iphone' : 'mac';
  let start: number | null = null; // when the current filename started typing; null: on the next frame
  let handle: Handle | undefined;
  let failed = false;

  const filename = () => `${WALLPAPERS[design].id}.png`;

  const render = () => {
    const w = WALLPAPERS[design], d = DEVICES.find((x) => x.id === device)!;
    root.dataset.device = device;
    for (const img of previews) {
      if (img.dataset.for !== device) continue;
      img.src = previewPath(w.id, device);
      img.alt = `${w.name} wallpaper for ${d.model}`;
    }
    download.href = downloadPath(w.id, device);
    download.setAttribute('download', `figment-${w.id}-${device}.png`);
    if (metaEl) metaEl.textContent = `${d.width}×${d.height} PNG · ${formatBytes(w.bytes[device])}`;
    if (nameEl) nameEl.textContent = w.name;
    if (pathEl) pathEl.textContent = `~/wallpapers/${device}/`;
    designBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === design)));
    deviceBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.wpDevice === device)));
    // the typing redraws the filename each frame; without it (reduced motion, or after a failure) show it whole
    if (reduced || failed) fileEl.textContent = filename();
    start = null;
  };

  designBtns.forEach((b, k) => b.addEventListener('click', () => { design = k; render(); }));
  deviceBtns.forEach((b) => b.addEventListener('click', () => { device = b.dataset.wpDevice as DeviceId; render(); }));
  render();
  if (reduced) return;

  const fail = (err: unknown): void => {
    if (failed) return;
    failed = true;
    reportError(err);
    fileEl.textContent = filename();
    try { if (cursorEl) cursorEl.style.visibility = ''; } catch { /* best effort */ }
    handle?.stop();
  };

  handle = register({
    el: root,
    fps: 30,
    frame: (t) => {
      if (failed) return;
      try {
        if (start === null) start = t;
        const { typed, cursor } = typedText(t - start, filename(), 0);
        if (fileEl.textContent !== typed) fileEl.textContent = typed;
        if (cursorEl) cursorEl.style.visibility = cursor ? '' : 'hidden';
      } catch (err) {
        fail(err);
      }
    },
  });
}
