import { describe, expect, it } from 'vitest';
import { GLYPHS, glyph, hashString, mulberry32 } from './rng';

describe('rng', () => {
  it('is deterministic for a seed and stays in [0, 1)', () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('hashes strings stably', () => {
    expect(hashString('01 / CLAUDEWITZ')).toBe(hashString('01 / CLAUDEWITZ'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });

  it('picks glyphs from the glyph set', () => {
    const r = mulberry32(1);
    for (let i = 0; i < 50; i++) expect(GLYPHS).toContain(glyph(r));
  });
});
