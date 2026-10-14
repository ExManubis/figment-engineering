import { describe, expect, it } from 'vitest';
import { ansiShadow } from './figlet';

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
