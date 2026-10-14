import { describe, expect, it } from 'vitest';
import { CGA, cgaArt, cgaPaint } from './cga';

// one solid block, 2 × 2 cells, beside some ANSI Shadow edging that is not part of the shape
const BLOCK = '██╗\n██║\n╚═╝';

describe('cgaArt', () => {
  const art = cgaArt(BLOCK);
  const lines = art.text.split('\n');
  const at = (x: number, y: number) => ({ ch: lines[y][x], colour: art.colours[y][x] });

  it('gives every cell a colour exactly when it has a glyph', () => {
    expect(lines).toHaveLength(art.rows);
    expect(art.colours).toHaveLength(art.rows);
    for (let y = 0; y < art.rows; y++) {
      expect(Array.from(lines[y])).toHaveLength(art.cols);
      for (let x = 0; x < art.cols; x++) expect(at(x, y).colour === null).toBe(at(x, y).ch === ' ');
    }
  });

  it('doubles the solid blocks and ignores the box-drawing edges', () => {
    // 1 cell of outline, 4 × 4 fill (2 × 2 doubled), then outline and shadow
    const fill = art.colours.flat().filter((c) => c === CGA.cyan || c === CGA.bright || c === CGA.white);
    expect(fill.length).toBeGreaterThanOrEqual(16);
    expect(lines.join('')).not.toMatch(/[╗║╚═╝]/);
  });

  it('runs the fill from cyan at the top to bright cyan at the bottom', () => {
    expect(at(1, 1).colour).toBe(CGA.cyan);
    expect(at(1, 4).colour).toBe(CGA.bright);
  });

  it('outlines the shape, white along its top edge and grey elsewhere', () => {
    expect(at(1, 0)).toEqual({ ch: '█', colour: CGA.white });
    expect(at(0, 2)).toEqual({ ch: '█', colour: CGA.grey });
    expect(at(5, 2).colour).toBe(CGA.grey);
  });

  it('rims a thin hole with half blocks, so its middle stays dark', () => {
    // a P-like ring: its one-row hole doubles to two rows, which full-block outlines from above and below would fill
    const ring = cgaArt('██████╗\n██╔═██║\n██████║');
    const rows = ring.text.split('\n');
    expect(rows[3].slice(5, 9)).toBe('█▀▀█');
    expect(rows[4].slice(5, 9)).toBe('█▄▄█');
    expect(ring.colours[3][6]).toBe(CGA.grey);
  });

  it('rims a taller hole with full blocks around a dark middle', () => {
    const ring = cgaArt('████\n█╔═█\n█║ █\n█╚═█\n████');
    const rows = ring.text.split('\n');
    expect(rows[3].slice(3, 7)).toBe('████');
    expect(rows[5][4]).not.toBe('█');
  });

  it('drops a dithered dark shadow below and to the right', () => {
    const shadow = at(6, 6);
    expect(shadow.colour).toBe(CGA.dark);
    expect('▓░').toContain(shadow.ch);
    expect(at(0, 6).ch).toBe(' '); // nothing below-left
  });
});

describe('cgaPaint', () => {
  it('draws one rect per run of a colour, in a cell-sized viewBox', () => {
    const svg = decodeURIComponent(cgaPaint({ cols: 4, rows: 2, colours: [['#F00', '#F00', '#F00', null], [null, '#0F0', null, '#0F0']] }).replace(/^data:image\/svg\+xml,/, ''));
    expect(svg).toContain('viewBox="0 0 4 2"');
    expect(svg).toContain('preserveAspectRatio="none"');
    expect(svg).toContain('<rect x="0" y="0" width="3" height="1" fill="#F00"/>');
    expect(svg.match(/<rect /g)).toHaveLength(3);
  });

  it('is a data URL usable in CSS url()', () => {
    expect(cgaPaint(cgaArt(BLOCK))).toMatch(/^data:image\/svg\+xml,[^"'()\s]+$/);
  });
});
