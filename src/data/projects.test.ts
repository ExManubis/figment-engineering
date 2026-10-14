import { describe, expect, it } from 'vitest';
import { frameLabel, projects } from './projects';

describe('projects', () => {
  it('has Claudewitz first, in its brand orange', () => {
    expect(projects[0].id).toBe('claudewitz');
    expect(projects[0].brand.primary).toBe('#DA7756');
  });

  it('keeps every entry within the design rules', () => {
    for (const p of projects) {
      expect(p.features.length).toBeGreaterThanOrEqual(3);
      expect(p.features.length).toBeLessThanOrEqual(4);
      expect(p.brand.primary).toMatch(/^#[0-9A-F]{6}$/i);
      for (const l of p.links) expect(Boolean(l.href) !== Boolean(l.copy)).toBe(true);
    }
  });

  it('formats frame labels', () => {
    expect(frameLabel(0, 'Claudewitz')).toBe('01 / CLAUDEWITZ');
    expect(frameLabel(11, 'Next')).toBe('12 / NEXT');
  });
});
