import { decodeText, makeTextSeeds } from '../decode/text';
import type { Rng } from '../decode/rng';

export const WORDMARK = 'FIGMENT\nENGINEERING';
export const LOCATION = '55.68°N 12.57°E\nCPH';

const WORD_LOOP_S = 5;
const LOCATION_LOOP_S = 6;
const COPYRIGHT_LOOP_S = 6;

export const wordmarkSeeds = (rng: Rng): number[] => makeTextSeeds(WORDMARK, rng);

/** The wordmark `t` seconds in: blank, decodes in over 2s, holds, scrambles back out; every 5s. */
export function wordmarkFrame(t: number, seeds: number[], rng: Rng): string {
  const c = t % WORD_LOOP_S;
  const p = c < 2.2 ? (c - 0.2) / 2 : c < 4.2 ? 1 : 1 - (c - 4.2) / 0.8;
  return decodeText(WORDMARK, seeds, p, rng);
}

/** The coordinates `t` seconds in: every digit rolls, then locks left to right, and holds; every 6s. */
export function locationFrame(t: number, rng: Rng): string {
  const c = t % LOCATION_LOOP_S;
  let k = 0;
  return Array.from(LOCATION)
    .map((ch) => {
      if (!/\d/.test(ch)) return ch;
      const locked = c >= 0.3 + k++ * 0.12;
      return locked ? ch : String(Math.floor(rng() * 10));
    })
    .join('');
}

/**
 * `text` `t` seconds in: typed out over 1.5s, held, erased, then a pause; every 6s. Always padded to the
 * same width, with a blinking block cursor at the end, so the row never shifts.
 */
export function copyrightFrame(t: number, text: string): string {
  const len = Array.from(text).length;
  const c = t % COPYRIGHT_LOOP_S;
  const step = (s: number) => Math.min(len, Math.floor(s * (len + 1)));
  const n = c < 1.5 ? step(c / 1.5) : c < 4.5 ? len : c < 5.5 ? len - step(c - 4.5) : 0;
  const cursor = Math.floor(t * 2) % 2 === 0 ? '█' : ' ';
  return Array.from(text).slice(0, n).join('').padEnd(len) + cursor;
}
