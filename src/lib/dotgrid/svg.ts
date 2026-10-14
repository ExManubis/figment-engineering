import { bgGridAlpha, dotRadius, grey, squareSize, type DotCell, type PaintSpec } from './paint';

/** The same picture paintCells draws, as an SVG string (for favicons and OG images). */
export function cellsToSvg(spec: PaintSpec, cells: readonly (DotCell | undefined)[]): string {
  const W = spec.cols * spec.cell, H = spec.rows * spec.cell;
  const bg = spec.background === undefined ? '#0A0A0A' : spec.background;
  const parts: string[] = [];
  if (bg) parts.push(`<rect width="${W}" height="${H}" fill="${bg}"/>`);
  for (let j = 0; j < spec.rows; j++) {
    for (let i = 0; i < spec.cols; i++) {
      const c = cells[j * spec.cols + i];
      const x = (i + 0.5) * spec.cell, y = (j + 0.5) * spec.cell;
      if (!c || c.cov <= 0.02) {
        const a = spec.bgGrid ? bgGridAlpha(spec, i, j) : 0;
        if (a > 0) parts.push(`<circle cx="${x}" cy="${y}" r="${(spec.cell * 0.11).toFixed(2)}" fill="#fff" fill-opacity="${a.toFixed(3)}"/>`);
        continue;
      }
      const fill = c.color ?? grey(c.lum);
      const op = c.alpha !== undefined && c.alpha < 1 ? ` fill-opacity="${c.alpha.toFixed(3)}"` : '';
      if (spec.square) {
        const s = squareSize(spec, c.cov);
        parts.push(`<rect x="${(x - s / 2).toFixed(2)}" y="${(y - s / 2).toFixed(2)}" width="${s.toFixed(2)}" height="${s.toFixed(2)}" fill="${fill}"${op}/>`);
      } else {
        parts.push(`<circle cx="${x}" cy="${y}" r="${dotRadius(spec, c.cov).toFixed(2)}" fill="${fill}"${op}/>`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${parts.join('')}</svg>`;
}
