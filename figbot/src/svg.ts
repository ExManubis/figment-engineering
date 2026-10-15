/** Figbot cells → halftone SVG, in cell units (one cell = one user unit). */

export const BG_COLOR = '#0A0A0A';
export const FG_COLOR = '#F2F2F2';

/** Dot radius as a fraction of a cell; 0 when there is no dot (background, hole, or too small to see). */
export function dotRadius(lum: number): number {
  if (lum <= 0) return 0;
  const r = Math.sqrt(lum) * 0.52;
  return r < 0.07 ? 0 : r;
}

/** `background: null` leaves the dots on a transparent ground. */
export function svgBody(c: ArrayLike<number>, cols: number, rows: number, background: string | null = BG_COLOR): string {
  const dots: string[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const r = dotRadius(c[j * cols + i]);
      if (r > 0) dots.push(`<circle cx="${i + 0.5}" cy="${j + 0.5}" r="${r.toFixed(3)}"/>`);
    }
  }
  const rect = background ? `<rect width="${cols}" height="${rows}" fill="${background}"/>` : '';
  return `${rect}<g fill="${FG_COLOR}">${dots.join('')}</g>`;
}

/** `pixelWidth` sets the displayed size (height follows the aspect ratio); it defaults to one pixel per cell. */
export function toSvg(c: ArrayLike<number>, cols: number, rows: number, viewWidth = cols, pixelWidth = viewWidth): string {
  const pixelHeight = (pixelWidth * rows) / viewWidth;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} ${rows}" width="${pixelWidth}" height="${pixelHeight}">${svgBody(c, cols, rows)}</svg>`;
}
