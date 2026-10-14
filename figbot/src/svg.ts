/** Figbot cells → halftone SVG, in cell units (one cell = one user unit). */

export const BG_COLOR = '#0A0A0A';
export const FG_COLOR = '#F2F2F2';

/** Dot radius as a fraction of a cell; 0 when there is no dot (background, hole, or too small to see). */
export function dotRadius(lum: number): number {
  if (lum <= 0) return 0;
  const r = Math.sqrt(lum) * 0.52;
  return r < 0.07 ? 0 : r;
}

export function svgBody(c: ArrayLike<number>, cols: number, rows: number): string {
  const dots: string[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const r = dotRadius(c[j * cols + i]);
      if (r > 0) dots.push(`<circle cx="${i + 0.5}" cy="${j + 0.5}" r="${r.toFixed(3)}"/>`);
    }
  }
  return `<rect width="${cols}" height="${rows}" fill="${BG_COLOR}"/><g fill="${FG_COLOR}">${dots.join('')}</g>`;
}

export function toSvg(c: ArrayLike<number>, cols: number, rows: number, viewWidth = cols): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} ${rows}" width="${viewWidth}" height="${rows}">${svgBody(c, cols, rows)}</svg>`;
}
