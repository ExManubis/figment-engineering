import { describe, expect, it } from 'vitest';
import { BG, HOLE } from './model';
import { BG_COLOR, FG_COLOR, dotRadius, svgBody, toSvg } from './svg';

describe('dotRadius', () => {
  it('draws nothing for background, holes and near-black', () => {
    expect(dotRadius(BG)).toBe(0);
    expect(dotRadius(HOLE)).toBe(0);
    expect(dotRadius(0.01)).toBe(0);
  });

  it('grows with the square root of luminance up to 0.52 of a cell', () => {
    expect(dotRadius(1)).toBeCloseTo(0.52, 10);
    expect(dotRadius(0.25)).toBeCloseTo(0.26, 10);
  });
});

describe('svg', () => {
  it('draws one circle per lit cell, centred in its cell', () => {
    const body = svgBody([BG, 1, HOLE, 0.25], 2, 2);
    expect(body.match(/<circle/g)).toHaveLength(2);
    expect(body).toContain('<circle cx="1.5" cy="0.5" r="0.520"/>');
    expect(body).toContain('<circle cx="1.5" cy="1.5" r="0.260"/>');
    expect(body).toContain(`fill="${BG_COLOR}"`);
    expect(body).toContain(`fill="${FG_COLOR}"`);
  });

  it('wraps the body in an svg sized in cells', () => {
    const svg = toSvg([1], 1, 1);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 1 1" width="1" height="1">/);
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('can crop the viewBox narrower than the grid (for exact aspect ratios)', () => {
    expect(toSvg([1, 1, 1], 3, 1, 2.5)).toContain('viewBox="0 0 2.5 1" width="2.5" height="1"');
  });

  it('can set the pixel size, keeping the aspect ratio', () => {
    expect(toSvg([1, 1], 2, 1, 2, 2048)).toContain('viewBox="0 0 2 1" width="2048" height="1024"');
  });

  it('can leave out the background, for dots over the page', () => {
    const body = svgBody([1], 1, 1, null);
    expect(body).not.toContain('<rect');
    expect(body).toContain('<circle');
  });
});
