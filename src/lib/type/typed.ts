import { cursorOn } from '../sparks/demo';

/** The default pause before typing starts, like a command taking a moment to answer. */
export const TYPE_DELAY_S = 0.4;
/** Seconds per letter. */
export const TYPE_S = 0.07;

/**
 * `text` typed out at a terminal, `t` seconds after typing was asked for (null: not yet): how much is typed, and
 * whether the block cursor shows. The cursor is steady until the text is done, then blinks like the Claudewitz
 * demo's. Used by the About title (`$ whoami`) and the wallpaper filename.
 */
export function typedText(t: number | null, text: string, delay = TYPE_DELAY_S): { typed: string; cursor: boolean } {
  const letters = Array.from(text);
  if (t === null) return { typed: '', cursor: true };
  const n = Math.max(0, Math.min(letters.length, Math.floor((t - delay) / TYPE_S)));
  if (n < letters.length) return { typed: letters.slice(0, n).join(''), cursor: true };
  const since = t - delay - letters.length * TYPE_S;
  return { typed: text, cursor: cursorOn(since * 1000) };
}
