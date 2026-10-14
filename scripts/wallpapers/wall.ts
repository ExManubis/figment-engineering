// The wallpapers' canvas: the site's own dot painter composed into one big SVG, rasterised with resvg.
import { Resvg } from '@resvg/resvg-js';
import { dotRadius, grey, type DotCell } from '../../src/lib/dotgrid/paint';

const FONTS = ['scripts/assets/DepartureMono-Regular.otf', 'scripts/assets/BitcountPropSingle-Regular.ttf'];
export const BG = '#0A0A0A';
export const FG = '#EDEDED';

export class Wall {
  parts: string[] = [];
  defs: string[] = [];
  constructor(public W: number, public H: number, public cell: number) {
    this.parts.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  }

  /** The site's background texture: faint dots on the grid, clear inside an ellipse and fading in toward the edges. */
  texture(alpha = 0.08, v = { cx: 0.5, cy: 0.5, rx: 0.75, ry: 0.7, inner: 0.35 }, skip?: (i: number, j: number) => boolean) {
    const c = this.cell, cols = Math.ceil(this.W / c), rows = Math.ceil(this.H / c);
    const r = c * 0.11;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      if (skip?.(i, j)) continue;
      const x = (i + 0.5) * c, y = (j + 0.5) * c;
      const d = Math.hypot((x - v.cx * this.W) / (v.rx * this.W), (y - v.cy * this.H) / (v.ry * this.H));
      const m = Math.max(0, Math.min(1, (d - v.inner) / (1 - v.inner)));
      const a = alpha * m;
      if (a > 0.004) this.parts.push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="#fff" fill-opacity="${a.toFixed(3)}"/>`);
    }
  }

  /** Dot cells (as the site paints them) with their top-left at grid cell (gi, gj), so they sit on the texture's grid. */
  cells(cells: readonly (DotCell | undefined)[], cols: number, rows: number, gi: number, gj: number, opts: { square?: boolean; scale?: number } = {}) {
    const c = this.cell, spec = { cols, rows, cell: c };
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const d = cells[j * cols + i];
      if (!d || d.cov <= 0.02) continue;
      const x = (gi + i + 0.5) * c + (d.dx ?? 0), y = (gj + j + 0.5) * c + (d.dy ?? 0);
      const fill = d.color ?? grey(d.lum);
      const op = d.alpha !== undefined && d.alpha < 1 ? ` fill-opacity="${d.alpha.toFixed(3)}"` : '';
      if (opts.square) {
        const s = c * (0.35 + 0.65 * d.cov) * (opts.scale ?? 1);
        this.parts.push(`<rect x="${(x - s / 2).toFixed(2)}" y="${(y - s / 2).toFixed(2)}" width="${s.toFixed(2)}" height="${s.toFixed(2)}" fill="${fill}"${op}/>`);
      } else {
        this.parts.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(dotRadius(spec, d.cov) * (opts.scale ?? 1)).toFixed(2)}" fill="${fill}"${op}/>`);
      }
    }
  }

  text(x: number, y: number, s: string, size: number, opts: { fill?: string; opacity?: number; anchor?: string; spacing?: number; family?: string } = {}) {
    const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    this.parts.push(`<text x="${x}" y="${y}" font-family="${opts.family ?? 'Departure Mono'}" font-size="${size}" fill="${opts.fill ?? FG}" fill-opacity="${opts.opacity ?? 1}" text-anchor="${opts.anchor ?? 'start'}" letter-spacing="${opts.spacing ?? 0}" xml:space="preserve">${esc}</text>`);
  }

  /** Multi-line monospace art (ANSI Shadow), top-left at (x, y); `fill` may be a gradient url. */
  art(x: number, y: number, art: string, size: number, fill = FG, lineHeight = 1) {
    art.split('\n').forEach((line, k) => this.text(x, y + size * lineHeight * (k + 0.8), line, size, { fill }));
  }

  gradient(id: string, x1: number, x2: number, stops: string[]) {
    this.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="0" x2="${x2}" y2="0">${stops.map((s, k) => `<stop offset="${k / (stops.length - 1)}" stop-color="${s}"/>`).join('')}</linearGradient>`);
    return `url(#${id})`;
  }

  raw(s: string) { this.parts.push(s); }

  svg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.W}" height="${this.H}" viewBox="0 0 ${this.W} ${this.H}"><defs>${this.defs.join('')}</defs>${this.parts.join('')}</svg>`;
  }

  /** The picture as a PNG `width` px wide (the full size by default). */
  png(width = this.W): Buffer {
    const opts = { fitTo: { mode: 'width' as const, value: width }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Departure Mono' } };
    return new Resvg(this.svg(), opts).render().asPng();
  }
}

/** Departure Mono's advance width, as a fraction of the font size (measured). */
export const ADVANCE = 0.6365;
export const artWidth = (art: string, size: number) => Math.max(...art.split('\n').map((l) => Array.from(l).length)) * size * ADVANCE;
