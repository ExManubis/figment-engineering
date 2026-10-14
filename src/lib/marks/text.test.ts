import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../decode/rng';
import { copyrightFrame, LOCATION, locationFrame, WORDMARK, wordmarkFrame, wordmarkSeeds } from './text';

const rng = mulberry32(1);

describe('wordmarkFrame', () => {
  const seeds = wordmarkSeeds(rng);

  it('starts blank, keeping the line break', () => {
    expect(wordmarkFrame(0, seeds, rng)).toBe(WORDMARK.replace(/\S/g, ' '));
  });

  it('settles on the wordmark and holds it, every loop', () => {
    expect(wordmarkFrame(3, seeds, rng)).toBe(WORDMARK);
    expect(wordmarkFrame(8, seeds, rng)).toBe(WORDMARK);
  });

  it('is part scrambled on the way in', () => {
    const mid = wordmarkFrame(1, seeds, rng);
    expect(mid).not.toBe(WORDMARK);
    expect(mid.split('\n').map((l) => l.length)).toEqual(WORDMARK.split('\n').map((l) => l.length));
  });
});

describe('locationFrame', () => {
  it('rolls only the digits, then locks them left to right', () => {
    const rolling = locationFrame(0.05, rng);
    expect(rolling.replace(/\d/g, '#')).toBe(LOCATION.replace(/\d/g, '#'));
    expect(locationFrame(3, rng)).toBe(LOCATION);
    expect(locationFrame(9, rng)).toBe(LOCATION);
  });
});

describe('copyrightFrame', () => {
  const text = '© 2026';

  it('types, holds and erases behind a block cursor, at a steady width', () => {
    expect(copyrightFrame(0, text)).toBe(' '.repeat(text.length) + '█');
    expect(copyrightFrame(3, text).slice(0, text.length)).toBe(text);
    expect(copyrightFrame(5.9, text).slice(0, text.length).trim()).toBe('');
    for (let t = 0; t < 6; t += 0.1) expect(Array.from(copyrightFrame(t, text))).toHaveLength(text.length + 1);
  });

  it('blinks the cursor while holding', () => {
    expect(copyrightFrame(3, text).at(-1)).not.toBe(copyrightFrame(3.5, text).at(-1));
  });
});
