import { describe, expect, it } from 'vitest';
import { about } from './about';

describe('about', () => {
  it('keeps every block short enough to sit in one column', () => {
    for (const block of [about.now, about.principles]) {
      expect(block.length).toBeGreaterThanOrEqual(3);
      expect(block.length).toBeLessThanOrEqual(4);
      for (const line of block) expect(line.length).toBeLessThanOrEqual(56);
    }
    expect(about.toolbox.length).toBeGreaterThanOrEqual(4);
    expect(about.toolbox.length).toBeLessThanOrEqual(10);
  });

  it('lists each tool once', () => {
    expect(new Set(about.toolbox).size).toBe(about.toolbox.length);
  });
});
