import { describe, expect, it } from 'vitest';
import { cellsToSvg } from './svg';

describe('cellsToSvg', () => {
  it('emits a background and one shape per lit cell', () => {
    const svg = cellsToSvg({ cols: 2, rows: 2, cell: 10 }, [{ cov: 1, lum: 1 }, undefined, undefined, { cov: 1, lum: 0.2 }]);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('viewBox="0 0 20 20"');
    expect(svg.match(/<circle/g)).toHaveLength(2);
    expect(svg).toContain('<rect width="20" height="20" fill="#0A0A0A"/>');
  });

  it('uses squares and no background when asked', () => {
    const svg = cellsToSvg({ cols: 1, rows: 1, cell: 2, square: true, background: null }, [{ cov: 1, lum: 1 }]);
    expect(svg).not.toContain('fill="#0A0A0A"');
    expect(svg.match(/<rect/g)).toHaveLength(1);
  });
});
