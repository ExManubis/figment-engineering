import { glyph, type Rng } from './rng';

/**
 * One seed per character: roughly left to right, with jitter.
 * Seeds stay below 1 − band, so every character has settled by p = 1.
 */
export function makeTextSeeds(text: string, rng: Rng, band = 0.1): number[] {
  const chars = Array.from(text);
  const n = Math.max(1, chars.length - 1);
  const spread = (1 - band) / 0.9;
  return chars.map((_, i) => spread * (0.7 * (i / n) + 0.2 * rng()));
}

/**
 * Whitespace never scrambles; other characters go blank → random glyph → final as p passes their seed.
 * `band` is how much of p each character spends scrambling; pass the same value given to makeTextSeeds.
 */
export function decodeText(text: string, seeds: number[], p: number, rng: Rng, band = 0.1): string {
  return Array.from(text)
    .map((c, i) => {
      if (/\s/.test(c)) return c;
      const s = seeds[i] ?? 0;
      return p >= s + band ? c : p >= s ? glyph(rng) : ' ';
    })
    .join('');
}
