import { describe, expect, it } from 'vitest';
import { COMMAND, OUTPUT, terminalText, TRANSCRIPT, TYPE_MS } from './demo';

describe('terminalText', () => {
  it('starts with an empty prompt', () => expect(terminalText(0)).toEqual({ text: '$ ', done: false }));
  it('types the command one character per tick', () => expect(terminalText(4 * TYPE_MS).text).toBe('$ brew'));
  it('prints the output after the command', () => {
    const t = terminalText(COMMAND.length * TYPE_MS + 400);
    expect(t.text.split('\n')[1]).toBe(OUTPUT[0]);
    expect(t.done).toBe(false);
  });
  it('ends with the full transcript', () => expect(terminalText(60_000)).toEqual({ text: TRANSCRIPT, done: true }));
  it('never goes backwards for negative time', () => expect(terminalText(-100).text).toBe('$ '));
});
