import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ register: vi.fn(), prefersReducedMotion: vi.fn(), reportError: vi.fn() }));
vi.mock('../motion/scheduler', () => ({ register: m.register, prefersReducedMotion: m.prefersReducedMotion }));
vi.mock('../report', () => ({ reportError: m.reportError }));

import { DEVICES, WALLPAPERS } from '../../data/wallpapers';
import { TYPE_S } from '../type/typed';
import { mountWallpapers } from './mount';

type Listener = () => void;
const el = (extra: Record<string, unknown> = {}) => {
  const attrs: Record<string, string> = {};
  const on: Record<string, Listener> = {};
  return {
    textContent: '', style: { visibility: '' }, dataset: {} as Record<string, string>, src: '', alt: '', href: '',
    setAttribute: (k: string, v: string) => { attrs[k] = v; },
    getAttribute: (k: string) => attrs[k] ?? null,
    addEventListener: (type: string, fn: Listener) => { on[type] = fn; },
    click: () => on.click?.(),
    attrs,
    ...extra,
  };
};

/** the section's markup as plain objects, server-rendered on Monolith for Mac */
function fakeSection() {
  const previews = DEVICES.map((d) => el({ dataset: { for: d.id } }));
  const designs = WALLPAPERS.map((w) => el({ dataset: { wpDesign: w.id } }));
  const devices = DEVICES.map((d) => el({ dataset: { wpDevice: d.id } }));
  const parts = { path: el(), file: el({ textContent: 'fe-monolith.png' }), cursor: el(), name: el(), meta: el(), download: el() };
  const root = {
    dataset: {} as Record<string, string>,
    querySelector: (sel: string) => ({
      '[data-wp-path]': parts.path, '[data-wp-file]': parts.file, '[data-wp-cursor]': parts.cursor,
      '[data-wp-name]': parts.name, '[data-wp-meta]': parts.meta, '[data-wp-download]': parts.download,
    })[sel] ?? null,
    querySelectorAll: (sel: string) => ({ '[data-wp-preview]': previews, '[data-wp-design]': designs, '[data-wp-device]': devices })[sel] ?? [],
  } as unknown as HTMLElement & { dataset: Record<string, string> };
  return { root, previews, designs, devices, ...parts };
}

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  m.prefersReducedMotion.mockReturnValue(false);
  m.register.mockReturnValue({ stop: vi.fn() });
  vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
});

describe('mountWallpapers', () => {
  it('shows Monolith for Mac on desktop, with its download and size', () => {
    const s = fakeSection();
    mountWallpapers(s.root);
    expect(s.root.dataset.device).toBe('mac');
    expect(s.previews[0].src).toBe('/wallpapers/preview/mac/fe-monolith.png');
    expect(s.download.href).toBe('/wallpapers/mac/fe-monolith.png');
    expect(s.download.attrs.download).toBe('figment-fe-monolith-mac.png');
    expect(s.meta.textContent).toMatch(/^5120×2880 PNG · \d/);
    expect(s.path.textContent).toBe('~/wallpapers/mac/');
    expect(s.designs[0].attrs['aria-pressed']).toBe('true');
    expect(s.devices[0].attrs['aria-pressed']).toBe('true');
  });

  it('starts on iPhone on a phone', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    const s = fakeSection();
    mountWallpapers(s.root);
    expect(s.root.dataset.device).toBe('iphone');
    expect(s.previews[3].src).toBe('/wallpapers/preview/iphone/fe-monolith.png');
  });

  it('switches design and device, and retypes the filename from the start', () => {
    const s = fakeSection();
    mountWallpapers(s.root);
    const anim = m.register.mock.calls[0][0] as { frame: (t: number) => void };
    anim.frame(10);
    anim.frame(20);
    expect(s.file.textContent).toBe('fe-monolith.png');

    s.designs[4].click(); // Claudewitz
    s.devices[2].click(); // iPad
    expect(s.root.dataset.device).toBe('ipad');
    expect(s.previews[2].src).toBe('/wallpapers/preview/ipad/cw-bean.png');
    expect(s.download.href).toBe('/wallpapers/ipad/cw-bean.png');
    expect(s.name.textContent).toBe('Claudewitz');
    expect(s.path.textContent).toBe('~/wallpapers/ipad/');
    expect(s.designs[4].attrs['aria-pressed']).toBe('true');
    expect(s.designs[0].attrs['aria-pressed']).toBe('false');

    anim.frame(30);
    anim.frame(30 + 2.5 * TYPE_S);
    expect(s.file.textContent).toBe('cw');
    anim.frame(40);
    expect(s.file.textContent).toBe('cw-bean.png');
  });

  it('under reduced motion shows the whole filename at once and never registers', () => {
    m.prefersReducedMotion.mockReturnValue(true);
    const s = fakeSection();
    mountWallpapers(s.root);
    s.designs[3].click();
    expect(s.file.textContent).toBe('fe-macro.png');
    expect(s.cursor.style.visibility).toBe('');
    expect(m.register).not.toHaveBeenCalled();
  });

  it('on a frame failure reports once, shows the whole filename and stops once; picking still works', () => {
    const stop = vi.fn();
    m.register.mockReturnValue({ stop });
    const s = fakeSection();
    mountWallpapers(s.root);
    Object.defineProperty(s.cursor, 'style', { get: () => { throw new Error('boom'); } });
    const anim = m.register.mock.calls[0][0] as { frame: (t: number) => void };
    expect(() => { anim.frame(1); anim.frame(2); }).not.toThrow();
    expect(m.reportError).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(s.file.textContent).toBe('fe-monolith.png');
    s.designs[2].click();
    expect(s.download.href).toBe('/wallpapers/mac/fe-homepage.png');
    expect(s.file.textContent).toBe('fe-homepage.png');
  });

  it('offers the MacBook Pro 16″ at its native size, named in full for screen readers', () => {
    const s = fakeSection();
    mountWallpapers(s.root);
    s.devices[1].click();
    expect(s.root.dataset.device).toBe('macbook');
    expect(s.previews[1].src).toBe('/wallpapers/preview/macbook/fe-monolith.png');
    expect(s.previews[1].alt).toBe('Monolith wallpaper for MacBook Pro 16″');
    expect(s.meta.textContent).toMatch(/^3456×2234 PNG · /);
  });
});
