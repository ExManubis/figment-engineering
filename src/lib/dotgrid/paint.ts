export interface DotCell {
  /** 0..1 coverage: partial = smaller dot (anti-aliasing) */
  cov: number;
  /** 0..1 brightness, used when no explicit colour */
  lum: number;
  color?: string;
  alpha?: number;
  /** offset from the cell's centre in CSS px, for dots knocked out of place */
  dx?: number;
  dy?: number;
}

export interface PaintSpec {
  cols: number;
  rows: number;
  /** cell size in CSS px */
  cell: number;
  /** square pixels instead of round dots (small sizes) */
  square?: boolean;
  /** faint, radially faded background dot grid */
  bgGrid?: boolean;
  /** default '#0A0A0A'; null = transparent */
  background?: string | null;
}

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function grey(v: number): string {
  const g = Math.round(28 + Math.pow(clamp01(v), 0.85) * 214);
  return `rgb(${g},${g},${g})`;
}

export const dotRadius = (spec: PaintSpec, cov: number): number => spec.cell * (0.16 + 0.27 * cov);
export const squareSize = (spec: PaintSpec, cov: number): number => spec.cell * (0.35 + 0.65 * cov);

export function bgGridAlpha(spec: PaintSpec, i: number, j: number): number {
  const dx = (i - spec.cols / 2) / (spec.cols / 2), dy = (j - spec.rows / 2) / (spec.rows / 2);
  const f = clamp01(1 - Math.hypot(dx * 0.9, dy) * 0.75);
  return f > 0.05 ? 0.1 * f : 0;
}

export function setupCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  // height follows the width, so a CSS max-width (narrow phones) scales the canvas without stretching it
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = `${cssW} / ${cssH}`;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function paintCells(ctx: CanvasRenderingContext2D, spec: PaintSpec, cells: readonly (DotCell | undefined)[]): void {
  const { cols, rows, cell } = spec;
  const bg = spec.background === undefined ? '#0A0A0A' : spec.background;
  ctx.globalAlpha = 1;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cols * cell, rows * cell);
  } else {
    ctx.clearRect(0, 0, cols * cell, rows * cell);
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const c = cells[j * cols + i];
      const x = (i + 0.5) * cell, y = (j + 0.5) * cell;
      if (!c || c.cov <= 0.02) {
        const a = spec.bgGrid ? bgGridAlpha(spec, i, j) : 0;
        if (a > 0) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, cell * 0.11, 0, Math.PI * 2);
          ctx.fill();
        }
        continue;
      }
      ctx.globalAlpha = c.alpha ?? 1;
      ctx.fillStyle = c.color ?? grey(c.lum);
      const cx = x + (c.dx ?? 0), cy = y + (c.dy ?? 0);
      if (spec.square) {
        const s = squareSize(spec, c.cov);
        ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius(spec, c.cov), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}
