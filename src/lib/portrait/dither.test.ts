import { describe, expect, it } from 'vitest';
import { placeholderLuminance, toDotCells } from './dither';

describe('toDotCells', () => {
  it('averages pixel blocks into cells', () => {
    const d = toDotCells(new Float32Array(16).fill(1), 4, 4, 2);
    expect(d).toEqual({ cols: 2, rows: 2, cells: [1, 1, 1, 1] });
  });
  it('turns dark areas off', () => {
    expect(toDotCells(new Float32Array(16), 4, 4, 2).cells).toEqual([0, 0, 0, 0]);
  });
  it('keeps the aspect ratio', () => {
    expect(toDotCells(new Float32Array(8 * 12), 8, 12, 4).rows).toBe(6);
  });
});

describe('placeholderLuminance', () => {
  it('draws a lit head-and-shoulders silhouette on black', () => {
    const w = 64, h = 80, lum = placeholderLuminance(w, h);
    expect(lum[Math.round(0.38 * h) * w + w / 2]).toBeGreaterThan(0.3);
    expect(lum[0]).toBe(0);
  });
});
