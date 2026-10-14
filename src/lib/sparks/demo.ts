export const PROMPT = '$ ';
export const COMMAND = 'brew install exmanubis/tap/claudewitz';
export const OUTPUT = ['==> Fetching exmanubis/tap/claudewitz', '==> Pouring claudewitz', '✓ claudewitz installed', '$ claudewitz'];
export const TYPE_MS = 40;
export const PAUSE_MS = 300;
export const LINE_MS = 350;
export const TRANSCRIPT = [PROMPT + COMMAND, ...OUTPUT].join('\n');

/** The terminal's text `ms` milliseconds into the demo. */
export function terminalText(ms: number): { text: string; done: boolean } {
  const typed = Math.min(COMMAND.length, Math.max(0, Math.floor(ms / TYPE_MS)));
  const after = ms - COMMAND.length * TYPE_MS - PAUSE_MS;
  const shown = typed < COMMAND.length || after < 0 ? 0 : Math.min(OUTPUT.length, Math.floor(after / LINE_MS) + 1);
  return { text: [PROMPT + COMMAND.slice(0, typed), ...OUTPUT.slice(0, shown)].join('\n'), done: shown === OUTPUT.length };
}

export const cursorOn = (ms: number): boolean => Math.floor(ms / 530) % 2 === 0;
