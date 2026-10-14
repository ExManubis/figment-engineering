import { describe, expect, it } from 'vitest';
import { ansiShadow, ansiShadowSpaced } from './figlet';

describe('ansiShadow', () => {
  it('renders ANSI Shadow with trailing whitespace and blank lines removed', () => {
    expect(ansiShadow('PP')).toBe(
      [
        '██████╗ ██████╗',
        '██╔══██╗██╔══██╗',
        '██████╔╝██████╔╝',
        '██╔═══╝ ██╔═══╝',
        '██║     ██║',
        '╚═╝     ╚═╝',
      ].join('\n'),
    );
  });

  it('upper-cases its input', () => {
    expect(ansiShadow('about')).toBe(ansiShadow('ABOUT'));
  });
});

describe('ansiShadowSpaced', () => {
  it('sets each letter on its own, padded to its width, with blank columns between', () => {
    const lines = ansiShadowSpaced('PR', 2).split('\n');
    expect(lines[0]).toBe('██████╗   ██████╗');
    expect(lines[1]).toBe('██╔══██╗  ██╔══██╗');
    expect(lines).toHaveLength(6);
  });

  it('keeps every solid block of the joined art', () => {
    const lines = ansiShadowSpaced('PROMPTTY', 1).split('\n');
    const solid = ansiShadow('PROMPTTY').split('\n').map((l) => (l.match(/█/g) ?? []).length);
    expect(lines.map((l) => (l.match(/█/g) ?? []).length)).toEqual(solid);
  });
});
