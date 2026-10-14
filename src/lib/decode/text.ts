import { glyph, type Rng } from './rng';

/** One seed per character: roughly left to right, with jitter. */
export function makeTextSeeds(text: string, rng: Rng): number[] {
  const chars = Array.from(text);
  const n = Math.max(1, chars.length - 1);
  return chars.map((_, i) => 0.7 * (i / n) + 0.2 * rng());
}

/** Whitespace never scrambles; other characters go blank → random glyph → final as p passes their seed. */
export function decodeText(text: string, seeds: number[], p: number, rng: Rng): string {
  return Array.from(text)
    .map((c, i) => {
      if (/\s/.test(c)) return c;
      const s = seeds[i] ?? 0;
      return p >= s + 0.1 ? c : p >= s ? glyph(rng) : ' ';
    })
    .join('');
}
