export interface BeanDot { x: number; y: number; color: string }
export interface BeanData { cols: number; rows: number; dots: BeanDot[] }

/**
 * Claudewitz's logo-dark.svg draws the bean (left) and the wordmark (right) as dots on a 6 px pitch.
 * Keep the dots left of maxX and convert them to grid coordinates starting at 0.
 */
export function parseBeanSvg(svg: string, maxX = 450, pitch = 6): BeanData {
  const re = /<circle cx="([\d.]+)" cy="([\d.]+)" r="[\d.]+" fill="(#[0-9a-fA-F]{6})"\/>/g;
  const raw: BeanDot[] = [];
  for (const m of svg.matchAll(re)) {
    const cx = Number(m[1]), cy = Number(m[2]);
    if (cx >= maxX) continue;
    raw.push({ x: Math.round((cx - pitch / 2) / pitch), y: Math.round((cy - pitch / 2) / pitch), color: m[3].toLowerCase() });
  }
  if (!raw.length) return { cols: 0, rows: 0, dots: [] };
  const minX = Math.min(...raw.map((d) => d.x)), minY = Math.min(...raw.map((d) => d.y));
  const dots = raw.map((d) => ({ x: d.x - minX, y: d.y - minY, color: d.color }));
  return {
    cols: Math.max(...dots.map((d) => d.x)) + 1,
    rows: Math.max(...dots.map((d) => d.y)) + 1,
    dots,
  };
}
