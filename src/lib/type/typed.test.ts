import { describe, expect, it } from 'vitest';
import { TYPE_DELAY_S, TYPE_S, typedText } from './typed';

const NAME = 'Mikkel Jørgensen';

describe('typedText', () => {
  it('shows nothing but a steady cursor before the section comes into focus', () => {
    expect(typedText(null, NAME)).toEqual({ typed: '', cursor: true });
  });

  it('waits a beat, then types one letter per step behind a steady cursor', () => {
    expect(typedText(TYPE_DELAY_S / 2, NAME)).toEqual({ typed: '', cursor: true });
    expect(typedText(TYPE_DELAY_S + 3.5 * TYPE_S, NAME)).toEqual({ typed: 'Mik', cursor: true });
  });

  it('counts the ø as one letter', () => {
    expect(typedText(TYPE_DELAY_S + 9.5 * TYPE_S, NAME).typed).toBe('Mikkel Jø');
  });

  it('holds the full name once typed, and blinks the cursor', () => {
    const done = TYPE_DELAY_S + NAME.length * TYPE_S;
    const blinks = [0, 0.3, 0.6, 0.9, 1.2].map((s) => typedText(done + s, NAME));
    expect(blinks.every((b) => b.typed === NAME)).toBe(true);
    expect(new Set(blinks.map((b) => b.cursor)).size).toBe(2);
  });

  it('starts straight away when asked to, for retyping on a new selection', () => {
    expect(typedText(1.5 * TYPE_S, 'fe-macro.png', 0).typed).toBe('f');
  });
});
