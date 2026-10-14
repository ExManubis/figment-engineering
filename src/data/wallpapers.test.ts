import { describe, expect, it } from 'vitest';
import { DEVICES, WALLPAPERS, downloadPath, formatBytes, previewPath, thumbPath } from './wallpapers';

describe('wallpapers', () => {
  it('has Monolith first, then the other Figment designs, then Claudewitz', () => {
    expect(WALLPAPERS[0].id).toBe('fe-monolith');
    expect(WALLPAPERS.map((w) => w.id.split('-')[0])).toEqual(['fe', 'fe', 'fe', 'fe', 'cw', 'cw']);
  });

  it('knows every file it links to, with its size in bytes', () => {
    for (const w of WALLPAPERS) for (const d of DEVICES) expect(w.bytes[d.id]).toBeGreaterThan(10_000);
  });

  it('builds the public paths', () => {
    expect(downloadPath('fe-monolith', 'mac')).toBe('/wallpapers/mac/fe-monolith.png');
    expect(previewPath('fe-monolith', 'iphone')).toBe('/wallpapers/preview/iphone/fe-monolith.png');
    expect(thumbPath('cw-bean')).toBe('/wallpapers/thumb/cw-bean.png');
  });

  it('has Mac, iPad and iPhone at their native sizes', () => {
    expect(DEVICES.map((d) => [d.id, d.width, d.height])).toEqual([['mac', 5120, 2880], ['ipad', 2752, 2064], ['iphone', 1320, 2868]]);
  });

  it('formats file sizes like ls -h', () => {
    expect(formatBytes(1_234_567)).toBe('1.2 MB');
    expect(formatBytes(345_678)).toBe('346 KB');
  });
});
