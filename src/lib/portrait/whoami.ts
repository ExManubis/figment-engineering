import { cursorOn } from '../sparks/demo';

/** The pause after `$ whoami` before the name starts, like a command taking a moment to answer. */
export const TYPE_DELAY_S = 0.4;
/** Seconds per letter. */
export const TYPE_S = 0.07;

/**
 * The About title `t` seconds after the section first came into focus, or before that when `t` is null:
 * how much of `name` is typed, and whether the block cursor shows. The cursor is steady until the name
 * is done, then blinks like the Claudewitz demo's.
 */
export function whoamiText(t: number | null, name: string): { typed: string; cursor: boolean } {
  const letters = Array.from(name);
  if (t === null) return { typed: '', cursor: true };
  const n = Math.max(0, Math.min(letters.length, Math.floor((t - TYPE_DELAY_S) / TYPE_S)));
  if (n < letters.length) return { typed: letters.slice(0, n).join(''), cursor: true };
  const since = t - TYPE_DELAY_S - letters.length * TYPE_S;
  return { typed: name, cursor: cursorOn(since * 1000) };
}
