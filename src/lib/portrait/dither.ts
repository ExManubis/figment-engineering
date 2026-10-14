export interface PortraitData {
  cols: number;
  rows: number;
  /** row-major; 0 = no dot, otherwise brightness 0..1 */
  cells: number[];
}

/** Box-average luminance (0..1) into a cols-wide grid of square cells. */
export function toDotCells(lum: ArrayLike<number>, w: number, h: number, cols: number): PortraitData {
  const size = w / cols;
  const rows = Math.round(h / size);
  const cells: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = Math.floor(c * size), x1 = Math.max(x0 + 1, Math.floor((c + 1) * size));
      const y0 = Math.floor(r * size), y1 = Math.max(y0 + 1, Math.floor((r + 1) * size));
      let sum = 0, n = 0;
      for (let y = y0; y < Math.min(y1, h); y++) for (let x = x0; x < Math.min(x1, w); x++) { sum += lum[y * w + x]; n++; }
      const v = Math.pow(n ? sum / n : 0, 1.2);
      cells.push(v < 0.08 ? 0 : Math.round(v * 100) / 100);
    }
  }
  return { cols, rows, cells };
}

/** A lit head-and-shoulders silhouette, used until Mikkel's photo is supplied. */
export function placeholderLuminance(w: number, h: number): Float32Array {
  const lum = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const head = ((x - 0.5 * w) / (0.17 * w)) ** 2 + ((y - 0.38 * h) / (0.22 * h)) ** 2;
      const shoulders = ((x - 0.5 * w) / (0.42 * w)) ** 2 + ((y - 1.02 * h) / (0.3 * h)) ** 2;
      if (head <= 1 || shoulders <= 1) lum[y * w + x] = 0.85 - 0.45 * (x / w); // light from the left
    }
  }
  return lum;
}
