import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';
import { decodeText, makeTextSeeds } from './text';

const TEXT = "Things I make\nwhen no one's asking.";

describe('decodeText', () => {
  it('returns the text exactly at p = 1', () => {
    const seeds = makeTextSeeds(TEXT, mulberry32(1));
    expect(decodeText(TEXT, seeds, 1, mulberry32(2))).toBe(TEXT);
  });

  it('keeps whitespace and line breaks at p = 0 and blanks everything else', () => {
    const seeds = makeTextSeeds(TEXT, mulberry32(1));
    const out = decodeText(TEXT, seeds, 0, mulberry32(2));
    expect(out).toHaveLength(TEXT.length);
    expect(out.split('\n')).toHaveLength(2);
    expect(out.replace(/\s/g, '')).toBe('');
  });

  it('decodes left to right overall', () => {
    const seeds = makeTextSeeds('abcdefghijklmnopqrstuvwxyz', mulberry32(5));
    const mid = decodeText('abcdefghijklmnopqrstuvwxyz', seeds, 0.5, mulberry32(6));
    expect(mid.startsWith('abc')).toBe(true);
    expect(mid.endsWith('xyz')).toBe(false);
  });

  it('settles every character by p = 1 with a wider scramble band', () => {
    const seeds = makeTextSeeds(TEXT, mulberry32(1), 0.3);
    expect(Math.max(...seeds)).toBeLessThanOrEqual(0.7);
    expect(decodeText(TEXT, seeds, 1, mulberry32(2), 0.3)).toBe(TEXT);
  });
});
