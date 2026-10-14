import { describe, expect, it } from 'vitest';
import { frameLabel, projects } from './projects';

describe('projects', () => {
  it('has Claudewitz first, in its brand orange', () => {
    expect(projects[0].id).toBe('claudewitz');
    expect(projects[0].brand.primary).toBe('#DA7756');
  });

  it('has Figbot second, a monochrome coming-soon teaser with the live mascot', () => {
    const f = projects[1];
    expect(f.id).toBe('figbot');
    expect(f.brand.gradient).toEqual(['#7A7A7A', '#F2F2F2']);
    expect(f.demo).toBe('figbot');
    expect(f.features).toEqual([]);
    expect(f.links).toEqual([]);
    expect(f.note).toBe('Coming soon');
  });

  it('has PrompTTY third, in its logo cyan', () => {
    expect(projects[2].id).toBe('promptty');
    expect(projects[2].brand.primary).toBe('#00AAAA');
    expect(projects[2].demo).toBe('promptty');
  });

  it('keeps every entry within the design rules', () => {
    for (const p of projects) {
      // a teaser (no links yet) shows no features; a shipped project shows 3–4
      if (p.links.length === 0) expect(p.features).toEqual([]);
      else {
        expect(p.features.length).toBeGreaterThanOrEqual(3);
        expect(p.features.length).toBeLessThanOrEqual(4);
      }
      expect(p.brand.primary).toMatch(/^#[0-9A-F]{6}$/i);
      for (const l of p.links) expect(Boolean(l.href) !== Boolean(l.copy)).toBe(true);
    }
  });

  it('formats frame labels', () => {
    expect(frameLabel(0, 'Claudewitz')).toBe('01 / CLAUDEWITZ');
    expect(frameLabel(11, 'Next')).toBe('12 / NEXT');
  });
});
